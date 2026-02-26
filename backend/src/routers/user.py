from .. import oauth2
from fastapi import APIRouter, Depends
from .. import models, schemas

router = APIRouter(prefix="/user", tags=["User"])
# Add response_model here
@router.get("/me", response_model=schemas.UserMeResponse)  
def get_me(current_user: models.User = Depends(oauth2.get_current_user)):
    print(f"DEBUG: Found user {current_user.email}, Admin status: {current_user.is_admin}")
    return current_user