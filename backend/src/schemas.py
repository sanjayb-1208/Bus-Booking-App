from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List



class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_admin: bool
    
    class Config:
        from_attributes = True

class UserMeResponse(BaseModel):
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
    id: int
    seat_number: int
    is_booked: bool
    is_locked: bool
    
    class Config:
        from_attributes = True

class TripResponse(BaseModel):
    id: int
    bus_id: int
    departure_time: datetime
    price: int
    seats: List[SeatResponse] = []

    class Config:
        from_attributes = True

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    trip_id: int
    seat_numbers: List[int]
    

    gender: str
    age: int
    phone_number: str

    class Config:
        from_attributes = True

class TripInfo(BaseModel):
    source: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: int

    class Config:
        from_attributes = True

class SeatInfo(BaseModel):
    seat_number: int

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    trip: TripInfo  # Nested trip details
    seat: SeatInfo  # Nested seat details

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

class TripCreate(BaseModel):
    bus_id: int
    source: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: int

class TripSearchResponse(BaseModel):
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