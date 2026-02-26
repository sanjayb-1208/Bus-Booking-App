from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Configuration for FastAPI-Mail connection
# Optimized for Google SMTP (Gmail) using SSL/TLS on Port 465
conf = ConnectionConfig(
    # Authentication credentials retrieved from environment variables
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_USERNAME"),
    
    # Connection Parameters
    MAIL_PORT = 465,                    # Port 465 is dedicated to implicit SSL
    MAIL_SERVER = "smtp.gmail.com",
    
    # Security Settings
    MAIL_STARTTLS = False,              # Disabled: STARTTLS is for Port 587
    MAIL_SSL_TLS = True,                # Enabled: Required for secure handshake on Port 465
    
    # Validation and Branding
    USE_CREDENTIALS = True,             # Authenticate with the username and password provided
    VALIDATE_CERTS = True,              # Verify SSL certificates for secure transmission
    MAIL_FROM_NAME = "ABC Travels Support"
)