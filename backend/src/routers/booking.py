import uuid
import os
from celery import Celery
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, oauth2
from ..database import get_db
from ..dependencies import manager, redis_client

# Initialize a Celery client to send tasks without importing the worker file
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_client = Celery(broker=REDIS_URL)

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)

# --- 1. Real-time Seat Locking ---

@router.post("/lock-seat/{trip_id}/{seat_no}")
async def lock_seat(
    trip_id: int, 
    seat_no: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    lock_key = f"lock:{trip_id}:{seat_no}"
    existing_owner = redis_client.get(lock_key)

    if existing_owner and existing_owner != str(current_user.id):
        raise HTTPException(status_code=400, detail="Seat occupied")

    redis_client.set(lock_key, current_user.id, ex=300)

    await manager.broadcast(int(trip_id), {
        "type": "SEAT_LOCKED",
        "seat_no": int(seat_no),
        "user_id": current_user.id
    })
    return {"status": "locked"}

@router.post("/unlock-seat/{trip_id}/{seat_no}")
async def unlock_seat(
    trip_id: int, 
    seat_no: int, 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    lock_key = f"lock:{trip_id}:{seat_no}"
    owner_id = redis_client.get(lock_key)

    if owner_id == str(current_user.id):
        redis_client.delete(lock_key)
        await manager.broadcast(int(trip_id), {
            "type": "SEAT_UNLOCKED",
            "seat_no": int(seat_no),
            "user_id": current_user.id
        })
        return {"message": "Seat released"}
    
    return {"message": "No action taken"}

# --- 2. Finalize Booking (The "Pay" Step) ---

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: schemas.BookingCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    current_user.gender = booking_data.gender
    current_user.age = booking_data.age
    current_user.phone_number = booking_data.phone_number
    db.add(current_user)

    trip = db.query(models.Trip).filter(models.Trip.id == booking_data.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    target_seats = db.query(models.Seat).filter(
        models.Seat.trip_id == booking_data.trip_id,
        models.Seat.seat_number.in_(booking_data.seat_numbers)
    ).all()

    if len(target_seats) != len(booking_data.seat_numbers):
        raise HTTPException(status_code=400, detail="Invalid seat numbers")

    group_pnr = f"ABC-{uuid.uuid4().hex[:6].upper()}"

    try:
        for seat in target_seats:
            if seat.is_booked:
                raise HTTPException(status_code=400, detail=f"Seat {seat.seat_number} already booked")
            
            seat.is_booked = True
            new_booking = models.Booking(
                booking_number=group_pnr,
                user_id=current_user.id,
                trip_id=booking_data.trip_id,
                seat_id=seat.id,
                status="confirmed"
            )
            db.add(new_booking)
            redis_client.delete(f"lock:{booking_data.trip_id}:{seat.seat_number}")
        
        db.commit()

        await manager.broadcast(int(booking_data.trip_id), {
            "type": "SEAT_BOOKED",
            "seat_numbers": [int(n) for n in booking_data.seat_numbers]
        })

        # --- TRIGGER CELERY TASK BY NAME ---
        # Using send_task prevents the need to import from celery_worker.py
        celery_client.send_task("send_booking_email_task", args=[current_user.email, group_pnr])
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"success": True, "booking_number": group_pnr}

# --- 3. Retrieval Routes ---

@router.get("/my-tickets")
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    grouped = {}
    for b in bookings:
        if b.booking_number not in grouped:
            grouped[b.booking_number] = {
                "booking_number": b.booking_number,
                "trip": b.trip,
                "status": b.status,
                "created_at": b.created_at,
                "seats": []
            }
        grouped[b.booking_number]["seats"].append(b.seat.seat_number)
    
    return list(grouped.values())

@router.get("/{booking_number}")
def get_booking(
    booking_number: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    bookings = db.query(models.Booking).filter(
        models.Booking.booking_number == booking_number,
        models.Booking.user_id == current_user.id
    ).all()
    
    if not bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    return {
        "booking_number": booking_number,
        "trip": bookings[0].trip,
        "seats": [b.seat.seat_number for b in bookings],
        "status": bookings[0].status,
        "created_at": bookings[0].created_at,
        "user_details": {
            "name": bookings[0].user.username,
            "phone": bookings[0].user.phone_number
        }
    }