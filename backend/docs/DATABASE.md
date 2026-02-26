# 🗄️ Database Documentation

This document describes the data persistence layer, the ORM configuration, and the seeding process.

---

## 🏗️ Schema Overview
The project uses **SQLAlchemy** as the ORM to manage relational data.

### **Core Models**
* **User**: Stores credentials, roles (Admin/User), and profile data.
* **Trip**: Contains route information, timing, and bus details.
* **Seat**: Tracks the availability and positioning of seats within a Trip.
* **Booking**: Links Users to specific Seats and Trips.



---

## 🛠️ Connection & Engine
* **Engine**: Initialized in `database.py`.
* **Initialization**: `models.Base.metadata.create_all` is triggered in the `lifespan` manager in `main.py` to ensure tables exist on startup.

---

## 🌱 Seeding (`/seed`)
The `seed.router` provides utility endpoints to populate the database during development.
* **Usage**: Typically used after a database reset.
* **Logic**: Iterates through JSON/List data to create initial Admin users and dummy Trip schedules.

---

## 🔄 Data Lifecycle
1. **Request**: FastAPI receives a request.
2. **Session**: A local DB session is provided via dependency injection.
3. **Commit**: Transactions are committed only after successful validation.