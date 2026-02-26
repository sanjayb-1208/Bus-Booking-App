import os
from celery import Celery
from .mail_utils import send_booking_email_sync

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(name="send_booking_email_task")
def send_booking_email_task(email: str, pnr: str):
    try:
        return send_booking_email_sync(email, pnr)
    except Exception as e:
        return str(e)