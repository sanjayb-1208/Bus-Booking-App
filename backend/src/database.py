import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables (e.g., DATABASE_URL)
load_dotenv()

# Retrieve the database connection string from the environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine to manage the connection pool
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Configure the session factory
# autocommit/autoflush=False ensures transactions are controlled manually
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the base class for all SQLAlchemy models to inherit from
Base = declarative_base()

def get_db():
    """
    Dependency to provide a database session for each request.
    Ensures the session is automatically closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Closing the session returns the connection to the pool
        db.close()