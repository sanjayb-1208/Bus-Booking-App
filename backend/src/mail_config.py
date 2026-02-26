from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
import os
load_dotenv()  # Load environment variables from .env file
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_USERNAME"),
    MAIL_PORT = 465,                    # Changed from 587
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = False,              # Must be False for Port 465
    MAIL_SSL_TLS = True,                # Must be True for Port 465
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,
    MAIL_FROM_NAME = "ABC Travels Support"
)