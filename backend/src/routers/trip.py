from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, timedelta
from ..database import get_db
from .. import models, schemas
from typing import List

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("/search", response_model=List[schemas.TripSearchResponse])
def search_trips(
    source: str, 
    destination: str, 
    travel_date: date, 
    db: Session = Depends(get_db)
):
    # 1. Define start and end of the chosen day for filtering
    start_of_day = datetime.combine(travel_date, datetime.min.time())
    end_of_day = datetime.combine(travel_date, datetime.max.time())

    # 2. Query Trips joined with Bus details
    trips = db.query(models.Trip).join(models.Bus).filter(
        models.Trip.source.ilike(source),
        models.Trip.destination.ilike(destination),
        models.Trip.departure_time.between(start_of_day, end_of_day)
    ).all()

    if not trips:
        return []

    # 3. Format result (including bus details and available seat count)
    results = []
    for trip in trips:
        # Count available seats for this specific trip
        available_seats = db.query(models.Seat).filter(
            models.Seat.trip_id == trip.id, 
            models.Seat.is_booked == False
        ).count()

        results.append({
            "trip_id": trip.id,
            "bus_name": trip.bus.bus_name,
            "bus_type": trip.bus.bus_type,
            "source": trip.source,
            "destination": trip.destination,
            "departure_time": trip.departure_time,
            "arrival_time": trip.arrival_time,
            "price": trip.price,
            "available_seats": available_seats
        })

    return results

@router.get("/{trip_id}/seats")
def get_trip_seats(trip_id: int, db: Session = Depends(get_db)):
    # Fetch all seats for the selected trip to show on the layout
    seats = db.query(models.Seat).filter(models.Seat.trip_id == trip_id).order_by(models.Seat.seat_number).all()
    if not seats:
        raise HTTPException(status_code=404, detail="No seats found for this trip")
    return seats

@router.get("/{trip_id}")
def get_trip_by_id(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    return trip
    