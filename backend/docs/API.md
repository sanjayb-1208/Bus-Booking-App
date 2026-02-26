# 📖 API Documentation

This document outlines the REST and WebSocket endpoints available in the Bus Booking API.

---

## 📡 Base URL
* **Local Development:** `http://localhost:8000`
* **Production:** `https://api.yourdomain.com`

---

## 🔐 Authentication (`/auth`)
Managed by the `auth.router`. These endpoints handle user identity.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Create a new user account | No |
| `/auth/login` | `POST` | Exchange credentials for a JWT token | No |
| `/auth/logout` | `POST` | Invalidate the current session token | Yes |

---

## 🚌 Trips (`/trip`)
Managed by the `trip.router`. Handles searching and schedule details.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/trip/search` | `GET` | Search for trips by origin/destination | No |
| `/trip/{id}` | `GET` | Get detailed info for a specific trip | No |

---

## 🎫 Bookings (`/booking`)
Managed by the `booking.router`. Handles the reservation lifecycle.

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/booking/reserve` | `POST` | Create a temporary hold on a seat | Yes |
| `/booking/confirm` | `POST` | Finalize payment and confirm ticket | Yes |
| `/booking/my-tickets`| `GET` | View booking history for the user | Yes |

---

## ⚡ Real-time WebSockets
WebSockets provide live seat updates to prevent double-booking.

### **Seat Status Socket**
* **URL:** `ws://localhost:8000/ws/seats/{trip_id}`
* **Parameters:** `trip_id` (Integer)

**Protocol Flow:**
1. **Connection:** Backend adds client to a trip-specific tracking group via `manager.connect`.
2. **Heartbeat:** Client sends `"ping"`; Server responds `"pong"`.
3. **Broadcast:** When a seat status changes, the server broadcasts the new state to all connected clients.



---

## 🛠️ Administrative & System
* **User (`/user`):** Profile management.
* **Admin (`/admin`):** System dashboard and overrides.
* **Seed (`/seed`):** Database initialization utilities.

---

## ⚠️ Error Codes
* `200 OK`: Success.
* `401 Unauthorized`: Invalid or missing Token.
* `403 Forbidden`: Admin privileges required.
* `404 Not Found`: Resource does not exist.
* `422 Unprocessable Entity`: Validation error.