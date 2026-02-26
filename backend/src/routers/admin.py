from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
import os
import shutil
from datetime import datetime, timedelta
from sqlalchemy import func, desc

router = APIRouter(prefix="/admin", tags=["Admin"])



@router.get("/analytics")
def get_advanced_stats(db: Session = Depends(get_db)):
    # 1. 7-Day Revenue Trend
    today = datetime.now().date()
    revenue_trend = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        daily_rev = db.query(func.sum(models.Trip.price))\
            .join(models.Booking)\
            .filter(func.date(models.Booking.created_at) == date)\
            .scalar() or 0
        revenue_trend.append({"day": date.strftime("%a"), "amount": daily_rev})

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
    occupancy_rate = 85.5 # Mock logic: total_bookings / (total_trips * 40) * 100

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