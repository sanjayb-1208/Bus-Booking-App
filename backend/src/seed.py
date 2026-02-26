import pandas as pd
import random
import string
import os
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from . import models

def generate_tn_number():
    """Generates a random TN registration number."""
    letter = random.choice(string.ascii_uppercase)
    digits = "".join(random.choices(string.digits, k=4))
    return f"TN 39 {letter} {digits}"

def seed_data(file_path: str, db: Session):
    # Load the Excel file
    df = pd.read_excel(file_path)
    
    # Clean hidden spaces from column headers
    df.columns = df.columns.str.strip()
    
    day_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, 
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    # --- Dynamic Date Logic ---
    # Find the latest trip date in the DB
    latest_trip_dt = db.query(func.max(models.Trip.departure_time)).scalar()
    
    if latest_trip_dt:

        start_date = latest_trip_dt.date() + timedelta(days=(7 - latest_trip_dt.weekday()))
    else:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    for _, row in df.iterrows():
        day_str = str(row['Day']).strip()
        if day_str not in day_map:
            continue

        bus = db.query(models.Bus).filter(models.Bus.bus_name == row['Bus Name']).first()
        if not bus:
            bus = models.Bus(
                bus_name=row['Bus Name'],
                bus_number=generate_tn_number(),
                bus_type=row['Bus Type'],
                total_seats=40
            )
            db.add(bus)
            db.flush()

        # 2. DateTime Calculation
        target_date = start_date + timedelta(days=day_map[day_str])
        dep_time = datetime.strptime(str(row['Departure Time']).strip(), "%I:%M %p").time()
        arr_time = datetime.strptime(str(row['Arrival Time']).strip(), "%I:%M %p").time()
        
        dep_dt = datetime.combine(target_date, dep_time)
        arr_dt = datetime.combine(target_date, arr_time)
        
        # If arrival is before departure, it's an overnight trip (arrives next day)
        if arr_dt <= dep_dt:
            arr_dt += timedelta(days=1)

        # 3. Create Trip
        trip = models.Trip(
            bus_id=bus.id,
            source=row['Source'],
            destination=row['Destination'],
            departure_time=dep_dt,
            arrival_time=arr_dt,
            price=row['Fare (INR)']
        )
        db.add(trip)
        db.flush()

        # 4. Create 40 Seats for this specific trip
        seats = [models.Seat(trip_id=trip.id, seat_number=n) for n in range(1, 41)]
        db.add_all(seats)

    db.commit()
    return True