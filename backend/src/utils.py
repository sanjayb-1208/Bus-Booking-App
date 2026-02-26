import os
from datetime import datetime, timedelta, timezone
from jose import jwt
from pwdlib import PasswordHash
from dotenv import load_dotenv

# Load sensitive configuration from environment variables
load_dotenv()

# Initialize the recommended password hashing algorithm (e.g., Argon2 or bcrypt)
password_hasher = PasswordHash.recommended()

# Security constants retrieved from .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def hash_password(password: str) -> str:
    """
    Takes a plain-text password and returns a secure, salted hash.
    Used during user registration.
    """
    return password_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares a plain-text password against a stored hash.
    Returns True if they match, False otherwise.
    """
    try:
        return password_hasher.verify(plain_password, hashed_password)
    except Exception:
        # Handles cases where the hash format might be invalid or corrupted
        return False

def create_access_token(data: dict):
    """
    Generates a signed JSON Web Token (JWT).
    
    Args:
        data (dict): The claims to include in the token (e.g., user_id).
        
    Returns:
        str: An encoded JWT string with a defined expiration timestamp.
    """
    to_encode = data.copy()
    
    # Set the expiration time based on current UTC time plus the defined window
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add the 'exp' claim to the payload
    to_encode.update({"exp": expire})
    
    # Sign and encode the token using the secret key
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)