from jose import JWTError, jwt
from datetime import datetime
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import database, models
from dotenv import load_dotenv
import os

# Initialize environment variables
load_dotenv()

# Define the OAuth2 scheme; the tokenUrl points to the login route
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')

# Security configuration retrieved from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "382048920492489302935745")
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    """
    Dependency function to validate the JWT token and return the current user.
    Used to protect routes that require authentication.
    """
    # Standard exception for authentication failures
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT token using the secret key and defined algorithm
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        
        # Ensure the user ID exists within the token payload
        if user_id is None:
            raise credentials_exception
    except JWTError:
        # Raised if the token is expired, tampered with, or invalid
        raise credentials_exception
        
    # Query the database to ensure the user still exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user