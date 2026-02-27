from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta, time
from .. import models, database
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_advanced_stats(db: Session = Depends(get_db)):
    """
    Fetches system-wide analytics including a 7-day revenue trend,
    top performing buses, and general system metrics.
    """
    # 1. 7-Day Revenue Trend Logic
    today = datetime.now().date()
    revenue_trend = []
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        
        # Create start and end of the day timestamps for accurate filtering
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)
        
        # Query total revenue for this 24-hour window
        # We ensure floats are returned to avoid JSON serialization issues with Decimals
        daily_rev = db.query(func.sum(models.Trip.price))\
            .join(models.Booking, models.Trip.id == models.Booking.trip_id)\
            .filter(models.Booking.created_at >= start_of_day)\
            .filter(models.Booking.created_at <= end_of_day)\
            .scalar() or 0
            
        revenue_trend.append({
            "day": target_date.strftime("%a"), 
            "amount": float(daily_rev)
        })

    # 2. Bus Performance (Revenue per Bus)
    # Ensure join conditions are explicit to prevent Cartesian products
    bus_stats = db.query(
        models.Bus.bus_name,
        func.count(models.Booking.id).label("total_tickets"),
        func.sum(models.Trip.price).label("revenue")
    ).join(models.Trip, models.Bus.id == models.Trip.bus_id)\
     .join(models.Booking, models.Trip.id == models.Booking.trip_id)\
     .group_by(models.Bus.id, models.Bus.bus_name)\
     .order_by(desc("revenue")).limit(5).all()

    # 3. Quick Metrics
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    
    # Calculate actual occupancy based on total bookings vs total capacity
    total_bookings = db.query(func.count(models.Booking.id)).scalar() or 0
    total_trips = db.query(func.count(models.Trip.id)).scalar() or 1 # Avoid div by zero
    # Assuming standard bus capacity is 40
    calculated_occupancy = round((total_bookings / (total_trips * 40)) * 100, 1)

    return {
        "trend": revenue_trend,
        "bus_performance": [
            {
                "name": b.bus_name, 
                "tickets": int(b.total_tickets), 
                "revenue": float(b.revenue) if b.revenue else 0.0
            } 
            for b in bus_stats
        ],
        "metrics": {
            "users": int(total_users),
            "occupancy": calculated_occupancy,
            "revenue": sum(d['amount'] for d in revenue_trend)
        }
    }