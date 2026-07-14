# 🚌 ABC Travels - Bus Booking & Fleet Management System

ABC Travels is a high-performance, enterprise-ready full-stack bus booking and fleet management application. The system features containerized microservices, a real-time seat locking mechanism, live synchronization via WebSockets, and asynchronous background tasks for PDF ticket generation and email dispatch.

---

## 🏗️ System Architecture

The application is built on a modular, containerized architecture that leverages separate services for database operations, caching, webSockets, and background workers:

```mermaid
graph TD
    User([Standard User / Admin]) <--> |HTTP / WebSockets| Frontend[Vite + React.js Client]
    Frontend <--> |FastAPI Gateway| Backend[FastAPI Server]
    
    Backend <--> |Read/Write| Postgres[(PostgreSQL Database)]
    Backend <--> |Query & Store Locks| Redis[(Redis Cache & Broker)]
    
    Redis <--> |Trigger Async Tasks| Celery[Celery Task Worker]
    Celery --> |Send Mail & PDF Boarding Pass| SMTP[Mail Server / FastMail]
    Celery <--> |Query Database| Postgres
```

---

## 🚀 Key Features

* **⚡ Real-Time Seat Locking:** Utilizes a high-performance **Redis-based** caching system to lock seats during user checkout (5-minute hold), preventing race conditions, double-bookings, and incomplete transaction locks.
* **🔄 Live WebSockets Synchronization:** Employs room-grouped WebSocket endpoints in **FastAPI** to broadcast live seat state updates (Locked, Unlocked, Sold) instantly to all connected users viewing the same trip.
* **📬 Asynchronous Background Tasks:** Uses **Celery** with **Redis** as a message broker to decouple heavy operations (like generation of PDF tickets and dispatch of SMTP emails) from the main API thread.
* **📄 Automated Ticket Generation:** Uses **ReportLab** to programmatically generate branded, print-ready PDF boarding passes with embedded **QR Codes** containing validation metadata.
* **📊 Administrative Control Center:** Features a metrics-driven admin panel displaying real-time analytics (7-day revenue trends, system-wide occupancy levels, and top route sales) built using optimized **SQLAlchemy** queries.
* **🔒 Role-Based Access Control (RBAC):** Restricts operational privileges between regular users (booking tickets, viewing tickets) and administrators (managing routes, updating schedules, seeding database).

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite, Lucide React (Icons), Axios, React Router Dom.
* **Backend:** FastAPI, Python 3.12, Uvicorn, SQLAlchemy (Asyncio support).
* **Package Manager:** [uv](https://github.com/astral-sh/uv) (Ultra-fast Python dependency management).
* **Database:** PostgreSQL (supports local PG or cloud-hosted DBs like Neon).
* **Cache & Message Broker:** Redis.
* **Task Worker:** Celery.
* **Orchestration & Tooling:** Docker, Docker Compose (featuring `docker compose watch` for live-sync development).

---

## 📂 Project Directory Structure

```text
Bus-Booking-App/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── abctravels_schedule.xlsx   # Sample Excel sheet for DB seeding
│   │   ├── routers/
│   │   │   ├── admin.py                  # Fleet analytics & reports
│   │   │   ├── auth.py                   # JWT Auth & authentication logic
│   │   │   ├── booking.py                # Seat locking & ticket booking
│   │   │   ├── seed.py                   # Upload & process schedule endpoint
│   │   │   ├── trip.py                   # Route searching & schedule querying
│   │   │   └── user.py                   # User account profile details
│   │   ├── celery_worker.py              # Celery task definition (Sends emails)
│   │   ├── database.py                   # SQLAlchemy connection pool setup
│   │   ├── dependencies.py               # WS Connection manager & Redis keyspace listener
│   │   ├── mail_utils.py                 # PDF generation & email templates
│   │   ├── models.py                     # SQLAlchemy Database models
│   │   ├── schemas.py                    # Pydantic validation schemas
│   │   └── main.py                       # FastAPI core startup & lifespans
│   ├── dockerfile
│   └── pyproject.toml                    # UV package dependencies config
├── frontend/
│   ├── src/
│   │   ├── components/                   # Shared UI Components
│   │   ├── context/                      # AuthContext for global login state
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx        # Admin stats & charts UI
│   │   │   ├── BusSeatLayout.jsx         # Live interactive seating grid
│   │   │   ├── Home.jsx                  # Trip search & home screen
│   │   │   ├── Login.jsx                 # Login form
│   │   │   ├── MyTickets.jsx             # Active passenger tickets list
│   │   │   └── TicketDetail.jsx          # Boarding pass & PDF download UI
│   │   └── App.jsx                       # Client-side router declarations
│   ├── dockerfile
│   └── package.json
└── docker-compose.yml                    # Main multi-service compose file
```

---

## ⚙️ Configuration & Environment Variables

Before launching the application, you must define the environment configurations.

### 1. Backend Settings
Create a `.env` file inside the `backend/` directory:
```env
# Database Settings
DATABASE_URL=postgresql://user:password@host/dbname   # PostgreSQL connection string

# Redis URL (For development with Docker, use 'redis://redis:6379/0')
REDIS_URL=redis://localhost:6379/0

# Security Settings
SECRET_KEY=your_super_secret_jwt_key                  # Generate using openssl rand -hex 32

# Mail Configuration (FastMail / Gmail SMTP settings)
MAIL_USERNAME=your_smtp_username@gmail.com
MAIL_PASSWORD=your_smtp_app_password
MAIL_FROM=your_smtp_username@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False

# Notifications
ADMIN_EMAIL=admin@example.com                         # Admin notification recipient
```

### 2. Frontend Settings
Create a `.env` file inside the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 🚀 Setup & Installation

### Option A: Running with Docker Compose (Recommended)
This method spins up the frontend, backend, Redis, and Celery worker instances seamlessly.

1. Ensure **Docker Desktop** is running.
2. In the root directory, build and run the services:
   ```bash
   docker compose up --build
   ```
3. **Hot-Reloading (Compose Watch):** You can run the compose stack with the watch flag. Any changes to local source code will instantly sync inside the running containers without rebuilding:
   ```bash
   docker compose watch
   ```
4. Access the applications:
   * **Frontend Client:** `http://localhost:5173`
   * **FastAPI Backend Swagger Docs:** `http://localhost:8000/docs`

---

### Option B: Manual Local Setup (Without Docker)

#### 1. Setup Redis
Ensure a Redis Server is running locally on port `6379`.
* **MacOS:** `brew install redis && brew services start redis`
* **Windows:** Start Redis via WSL or download the native MSI package.
* **Linux:** `sudo systemctl start redis-server`

#### 2. Run the Backend (FastAPI + Celery)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies using **uv** (or pip):
   ```bash
   uv sync
   ```
3. Start the FastAPI web application server:
   ```bash
   uv run uvicorn src.main:app --reload --port 8000
   ```
4. In a separate terminal tab, run the Celery task worker:
   ```bash
   uv run celery -A src.celery_worker.celery_app worker --loglevel=info
   ```

#### 3. Run the Frontend (Vite + React)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the local dev server:
   ```bash
   npm run dev
   ```
4. Open your browser to: `http://localhost:5173`

---

## 📊 Database Seeding Guide

To seed the application database with initial bus types, routes, schedules, and seat layouts, you can use the built-in setup router.

1. Sign up/Login to the application.
2. Access the database seeding route by navigating to:
   `http://localhost:5173/admin/seed`
3. Upload the sample Excel schedule sheet provided in:
   `backend/src/data/abctravels_schedule.xlsx`
4. The system will parse the spreadsheet, automatically register buses and routes, dynamically adjust upcoming calendar trip dates, and generate 40 fresh seat objects for each trip.

---

## 🔌 API Documentation Reference

The FastAPI backend exposes an interactive **Swagger UI** for testing endpoints directly. Once the backend server is running, navigate to `http://localhost:8000/docs`.

### Primary API Routes:
* **`/auth`**
  * `POST /auth/register` - Create user accounts (Admin accounts are registered by setting `is_admin=True` in the database).
  * `POST /auth/login` - Authenticate users and return access JWTs.
* **`/trips`**
  * `GET /trips` - Query and filter active trip schedules by source, destination, and dates.
  * `GET /trips/{trip_id}/seats` - Retrieve physical seating charts and availability details.
* **`/bookings`**
  * `POST /bookings/lock-seat/{trip_id}/{seat_no}` - Establish a temporary Redis lock on a selected seat.
  * `POST /bookings/unlock-seat/{trip_id}/{seat_no}` - Release a temporary lock manually.
  * `POST /bookings` - Finalize transactions, write bookings to Postgres, clear Redis holds, and trigger Celery tickets.
* **`/admin`**
  * `GET /admin/analytics` - Fetch weekly revenue trend lines, route load metrics, and fleet stats (Requires Admin permissions).
* **`/setup`**
  * `POST /setup/seed-schedule` - Upload Excel files to seed live schedules.
