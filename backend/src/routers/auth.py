from sqlalchemy.orm import Session
from .. import models, schemas, utils
from ..database import get_db
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request



router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not utils.verify_password(user_credentials.password, user.password):
        return {"success" : False, "message" : "Invalid email or password"}
    access_token = utils.create_access_token(data={"sub": user.email, "id": user.id})    
    return {"success": True, "access_token": access_token, "token_type": "bearer"}

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        return {"success" : False, "message" : "Email already Exists"}

    hashed_pwd = utils.hash_password(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"success" : True, "data": new_user}