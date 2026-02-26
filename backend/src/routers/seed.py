import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import shutil
from sqlalchemy.orm import Session
from ..database import get_db
from ..seed import seed_data

router = APIRouter(prefix="/setup", tags=["Database Setup"])

@router.post("/seed-schedule")
async def run_seed(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel file.")

    temp_path = f"temp_{file.filename}"
    try:
        # Save uploaded file temporarily
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        seed_data(temp_path, db)
        return {"status": "success", "message": "Database seeded successfully from uploaded file."}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)