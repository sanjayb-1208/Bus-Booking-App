# ⚡ Real-time Architecture (WebSockets & Redis)

This document explains how the system handles live seat updates and temporary seat holds using a combination of FastAPI, Redis, and WebSockets.

---

## 🔄 System Overview

The real-time system ensures that when one user selects a seat, all other users viewing the same trip see that seat as "Reserved" or "Locked" instantly.



---

## 🛠️ Components

### 1. Lifespan Manager (`@asynccontextmanager`)
The backend lifecycle is managed to ensure resources are initialized and cleaned up properly.
* **Startup:** * Creates database tables using SQLAlchemy.
    * Configures Redis to notify the app when keys expire (`Ex`).
    * Starts the `redis_expiration_listener` as a background task.
* **Shutdown:** * Cancels the background task gracefully.
    * Closes the Redis connection.

### 2. Redis Expiration Listener
Used for **Temporary Seat Holds**.
* When a user selects a seat, a key is created in Redis with a TTL (Time-To-Live).
* If the user doesn't complete the booking, the key expires.
* The `redis_expiration_listener` catches this event and broadcasts a message via WebSockets to unlock that seat for everyone else.

### 3. Connection Manager (`manager`)
Located in `dependencies.py`, this utility tracks active WebSocket connections.
* **`connect(trip_id, websocket)`**: Groups users based on the specific `trip_id`.
* **`disconnect(trip_id, websocket)`**: Removes users when they leave the page or lose connection.

---

## 🔌 WebSocket Protocol: `/ws/seats/{trip_id}`

### **Connection Flow**
1. Client connects to `ws://server/ws/seats/101`.
2. Backend validates the `trip_id`.
3. Client is added to the "Room" for Trip 101.

### **Heartbeat (Keep-Alive)**
To prevent the connection from timing out, the client should send a "ping".
* **Client Sent:** `"ping"`
* **Server Response:** `"pong"`



---

## ⚙️ Redis Configuration
To enable the expiration listener, the following command is executed on startup:
```bash
CONFIG SET notify-keyspace-events Ex