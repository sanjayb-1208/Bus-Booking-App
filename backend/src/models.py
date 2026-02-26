from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
from sqlalchemy.sql import func

class User(Base):
    """
    Represents the system users, including both customers and administrators.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    phone_number = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)  # Determines access to administrative routes

class Bus(Base):
    """
    Defines the physical bus assets available in the fleet.
    """
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True, index=True)
    bus_name = Column(String, unique=True)
    bus_number = Column(String, unique=True)
    bus_type = Column(String)  # e.g., AC, Non-AC, Sleeper
    total_seats = Column(Integer, default=40)

class Trip(Base):
    """
    Represents a specific journey scheduled for a Bus from source to destination.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"))
    source = Column(String)
    destination = Column(String)
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    price = Column(Integer)
    
    # Relationships
    bus = relationship("Bus")
    seats = relationship("Seat", back_populates="trip")

class Seat(Base):
    """
    Tracks the availability and locking status of individual seats for a specific Trip.
    Used for real-time seat selection and temporary locks.
    """
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    seat_number = Column(Integer)
    is_booked = Column(Boolean, default=False)  # Persistent booking status
    is_locked = Column(Boolean, default=False)  # Temporary status for selection phase
    locked_until = Column(DateTime, nullable=True) # Expiration timestamp for the temporary lock

    trip = relationship("Trip", back_populates="seats")

class Booking(Base):
    """
    Stores the final transaction details linking a User to a specific Seat on a Trip.
    """
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String, index=True) # Unique reference for the ticket
    user_id = Column(Integer, ForeignKey("users.id"))
    trip_id = Column(Integer, ForeignKey("trips.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"))
    status = Column(String, default="confirmed") # e.g., confirmed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships to access associated data objects
    user = relationship("User")
    trip = relationship("Trip")
    seat = relationship("Seat")