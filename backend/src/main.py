import os
import json
import redis
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .dependencies import manager, redis_client, redis_expiration_listener
from .database import engine
from . import models
from .routers import auth, trip, user, seed, booking, admin

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)    
    try:
        redis_client.config_set("notify-keyspace-events", "Ex")
    except Exception as e:
        print(f"Redis Config Warning: {e}")
    bg_task = asyncio.create_task(redis_expiration_listener())
    yield
    bg_task.cancel()
    try:
        await bg_task
    except asyncio.CancelledError:
        pass
    redis_client.close()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.websocket("/ws/seats/{trip_id}")
async def websocket_endpoint(websocket: WebSocket, trip_id: int):
    t_id = int(trip_id)
    await manager.connect(t_id, websocket)    
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(t_id, websocket)
    except Exception as e:
        print(f"WebSocket error on trip {t_id}: {e}")
        manager.disconnect(t_id, websocket)

@app.get("/")
def read_root():
    return {"success": True, "message": "Bus Booking API is Live"}

app.include_router(auth.router)
app.include_router(trip.router)
app.include_router(seed.router)
app.include_router(user.router)
app.include_router(booking.router)
app.include_router(admin.router)