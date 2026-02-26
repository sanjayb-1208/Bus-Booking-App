# Bus-Booking-App

# Bus Booking & Management System

A full-stack, enterprise-ready bus booking application. This project features a containerized microservices architecture with automated background tasks and Role-Based Access Control (RBAC).

## 🚀 Key Features
- **Real-time Booking**: Seamless seat selection and reservation logic.
- **Role-Based Access Control (RBAC)**: 
    - **User**: Search buses and book tickets.
    - **Admin**: Access to a dedicated Dashboard to manage bus schedules and view all bookings.
- **Admin Data Seeding**: Special administrative routes to seed the database with initial bus and route data.
- **Automated Notifications**: Celery workers process background email confirmations via Redis.
- **Modern Dev-X**: Utilizing `docker compose watch` for instant code synchronization.

## 🛠️ Tech Stack
- **Frontend**: React (Vite) with Type Module support.
- **Backend**: FastAPI (Python 3.12).
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (for ultra-fast dependency management).
- **Database**: PostgreSQL (hosted on Neon DB).
- **Task Queue**: Celery + Redis.
- **Containerization**: Docker & Docker Compose.

## 📦 System Architecture
The application is orchestrated using four primary services:
1. **Frontend**: The React UI.
2. **Backend**: The FastAPI server handling business logic and RBAC.
3. **Redis**: The message broker for asynchronous tasks.
4. **Worker**: The Celery instance dedicated to email and background processing.



---

## 🛠️ Setup & Installation

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory. **Do not commit this file.** Use the following template:
```env
DATABASE_URL=your_postgresql_url
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your_jwt_secret_key
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
ADMIN_EMAIL=admin@example.com
