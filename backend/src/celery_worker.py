import os
from celery import Celery
from .mail_utils import send_booking_email_sync

# Configuration for the Redis message broker and result backend
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize the Celery application
# 'tasks' is the name of the main module for the worker
celery_app = Celery(
    "tasks",
    broker=REDIS_URL,   # Where tasks are sent (Redis)
    backend=REDIS_URL   # Where results are stored (Redis)
)

@celery_app.task(name="send_booking_email_task")
def send_booking_email_task(email: str, pnr: str):
    """
    Background task to handle email dispatch.
    By offloading this to Celery, the booking API remains fast 
    and is not delayed by SMTP network latency.
    """
    try:
        # Calls the synchronous wrapper which handles PDF generation and mailing
        return send_booking_email_sync(email, pnr)
    except Exception as e:
        # Return error string so it can be logged in the Celery backend
        return str(e)