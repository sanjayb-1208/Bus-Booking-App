from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- User Schemas ---

class UserLogin(BaseModel):
    """Schema for user authentication requests."""
    email: EmailStr
    password: str

class UserBase(BaseModel):
    """Base schema for shared user attributes."""
    username: str
    email: EmailStr

class UserCreate(UserBase):
    """Schema for new user registration; includes password."""
    password: str

class UserResponse(UserBase):
    """Standard user representation for API responses."""
    id: int
    is_admin: bool
    
    class Config:
        # Allows Pydantic to read data from SQLAlchemy models (ORM mode)
        from_attributes = True

class UserMeResponse(BaseModel):
    """Detailed user profile schema for the 'current user' endpoint."""
    id: int
    email: EmailStr
    username: str
    is_admin: bool
    phone_number: str | None = None
    age: int | None = None
    gender: str | None = None

    class Config:
        from_attributes = True

# --- Seat & Trip Schemas ---

class SeatResponse(BaseModel):
    """Schema representing an individual seat's status for a trip."""
    id: int
    seat_number: int
    is_booked: bool
    is_locked: bool
    
    class Config:
        from_attributes = True

class TripResponse(BaseModel):
    """Detailed trip schema including the full list of seats."""
    id: int
    bus_id: int
    departure_time: datetime
    price: int
    seats: List[SeatResponse] = []

    class Config:
        from_attributes = True

# --- Booking Schemas ---

class BookingCreate(BaseModel):
    """Schema for creating a new booking reservation."""
    trip_id: int
    seat_numbers: List[int]
    gender: str
    age: int
    phone_number: str

    class Config:
        from_attributes = True

class TripInfo(BaseModel):
    """Simplified trip details for nesting within booking responses."""
    source: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: int

    class Config:
        from_attributes = True

class SeatInfo(BaseModel):
    """Simplified seat details for nesting within booking responses."""
    seat_number: int

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    """Full booking confirmation schema with nested trip and seat info."""
    id: int
    status: str
    created_at: datetime
    trip: TripInfo  # Nested trip details
    seat: SeatInfo  # Nested seat details

    class Config:
        from_attributes = True

class TripCreate(BaseModel):
    """Schema for administrative trip creation."""
    bus_id: int
    source: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: int

class TripSearchResponse(BaseModel):
    """Schema for trip search results, including aggregated availability."""
    trip_id: int
    bus_name: str
    bus_type: str
    source: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    available_seats: int

    class Config:
        from_attributes = True