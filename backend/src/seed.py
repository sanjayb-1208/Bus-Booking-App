import pandas as pd
import random
import string
import os
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from . import models

def generate_tn_number():
    """
    Generates a random Tamil Nadu (TN) registration number format.
    Example output: 'TN 39 A 1234'
    """
    letter = random.choice(string.ascii_uppercase)
    digits = "".join(random.choices(string.digits, k=4))
    return f"TN 39 {letter} {digits}"

def seed_data(file_path: str, db: Session):
    """
    Parses an Excel file to populate the database with Bus, Trip, and Seat data.
    Automatically calculates upcoming dates to ensure the schedule is current.
    """
    # Load the Excel file into a DataFrame
    df = pd.read_excel(file_path)
    
    # Clean hidden spaces from column headers for reliable access
    df.columns = df.columns.str.strip()
    
    # Map weekday strings to integer indexes (Monday=0, Sunday=6)
    day_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, 
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }

    # --- Dynamic Date Logic ---
    # Retrieve the latest trip departure date existing in the database
    latest_trip_dt = db.query(func.max(models.Trip.departure_time)).scalar()
    
    if latest_trip_dt:
        # If trips exist, start seeding from the following Monday
        start_date = latest_trip_dt.date() + timedelta(days=(7 - latest_trip_dt.weekday()))
    else:
        # If DB is empty, start seeding from the beginning of the current week
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())

    for _, row in df.iterrows():
        day_str = str(row['Day']).strip()
        if day_str not in day_map:
            continue

        # 1. Bus Management: Fetch existing bus or create a new entry
        bus = db.query(models.Bus).filter(models.Bus.bus_name == row['Bus Name']).first()
        if not bus:
            bus = models.Bus(
                bus_name=row['Bus Name'],
                bus_number=generate_tn_number(),
                bus_type=row['Bus Type'],
                total_seats=40
            )
            db.add(bus)
            db.flush() # Flush to get the bus.id for the Trip relation

        # 2. DateTime Calculation
        # Determine the specific date for the trip based on the week start
        target_date = start_date + timedelta(days=day_map[day_str])
        dep_time = datetime.strptime(str(row['Departure Time']).strip(), "%I:%M %p").time()
        arr_time = datetime.strptime(str(row['Arrival Time']).strip(), "%I:%M %p").time()
        
        dep_dt = datetime.combine(target_date, dep_time)
        arr_dt = datetime.combine(target_date, arr_time)
        
        # If arrival time is numerically lower than departure, assume next-day arrival
        if arr_dt <= dep_dt:
            arr_dt += timedelta(days=1)

        # 3. Create Trip Entry
        trip = models.Trip(
            bus_id=bus.id,
            source=row['Source'],
            destination=row['Destination'],
            departure_time=dep_dt,
            arrival_time=arr_dt,
            price=row['Fare (INR)']
        )
        db.add(trip)
        db.flush() # Flush to get trip.id for seat association

        # 4. Generate Initial Seat Map
        # Create 40 individual Seat entries for this specific trip
        seats = [models.Seat(trip_id=trip.id, seat_number=n) for n in range(1, 41)]
        db.add_all(seats)

    # Finalize all transactions to the database
    db.commit()
    return True