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
        
        # Query total revenue specifically for this 24-hour window
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
    bus_stats = db.query(
        models.Bus.bus_name,
        func.count(models.Booking.id).label("total_tickets"),
        func.sum(models.Trip.price).label("revenue")
    ).join(models.Trip, models.Bus.id == models.Trip.bus_id)\
     .join(models.Booking, models.Trip.id == models.Booking.trip_id)\
     .group_by(models.Bus.id)\
     .order_by(desc("revenue")).limit(5).all()

    # 3. Quick Metrics
    total_users = db.query(func.count(models.User.id)).scalar()
    # Mock occupancy calculation or actual logic based on seat availability
    occupancy_rate = 85.5 

    return {
        "trend": revenue_trend,
        "bus_performance": [
            {"name": b.bus_name, "tickets": b.total_tickets, "revenue": b.revenue} 
            for b in bus_stats
        ],
        "metrics": {
            "users": total_users,
            "occupancy": occupancy_rate,
            "revenue": sum(d['amount'] for d in revenue_trend)
        }
    }