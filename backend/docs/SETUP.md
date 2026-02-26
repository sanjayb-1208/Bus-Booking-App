# ⚙️ Installation & Setup

Follow these steps to get the backend environment running locally.

---

## 📋 Prerequisites
* **Python 3.10+**
* **Redis Server** (Local or Docker)
* **Virtual Environment** (Recommended)

---

## 🛠️ Step-by-Step Setup

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=sqlite:///./sql_app.db
REDIS_HOST=localhost
REDIS_PORT=6379
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256