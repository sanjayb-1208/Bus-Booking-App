### 3. `ARCHITECTURE.md`
Store this to explain the "Big Picture" of your full-stack app.

```markdown
# 🏗️ System Architecture

This document explains how the Frontend, Backend, and Real-time layers interact.

---

## 🗺️ High-Level Flow
1. **Frontend (Vite/React)**: Sends REST requests for data and establishes WebSockets for live seat maps.
2. **Backend (FastAPI)**: Validates requests, interacts with the DB, and manages Redis keys.
3. **Cache (Redis)**: Handles short-term data (temporary seat holds) and triggers expiration events.
4. **Database (SQLAlchemy)**: Stores persistent data (Users, Trips, confirmed Bookings).



---

## 🔄 Interaction Patterns

### **Standard Requests (REST)**
Used for Login, Searching Trips, and viewing Profiles. These are stateless and follow the standard Request-Response pattern.

### **Real-time Synchronization**
Used during the seat selection process.
* **Action**: User clicks a seat.
* **Process**: Backend sets a Redis key with a 10-minute TTL.
* **Update**: WebSocket broadcasts the "Locked" status to all other users on that trip.

---

## 🛡️ Security
* **JWT**: Authentication tokens are passed in the `Authorization` header.
* **CORS**: Configured in `main.py` to only allow specific origins (Localhost 5173).
* **Environment Isolation**: Sensitive keys are kept out of the codebase via `.env`.