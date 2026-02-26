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

# Load environment variables from .env file
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the application lifecycle:
    - Startup: Initializes database tables and starts Redis background tasks.
    - Shutdown: Cleans up background tasks and closes connections.
    """
    # Create database tables based on SQLAlchemy models
    models.Base.metadata.create_all(bind=engine)    
    
    try:
        # Enable Redis keyspace notifications for expired events (Ex)
        # This allows the app to react when a temporary seat hold expires
        redis_client.config_set("notify-keyspace-events", "Ex")
    except Exception as e:
        print(f"Redis Config Warning: {e}")
    
    # Run the Redis expiration listener as a non-blocking background task
    bg_task = asyncio.create_task(redis_expiration_listener())
    
    yield  # Application logic runs here
    
    # Graceful shutdown: cancel the background listener and close Redis connection
    bg_task.cancel()
    try:
        await bg_task
    except asyncio.CancelledError:
        pass
    redis_client.close()

# Initialize FastAPI app with the defined lifespan manager
app = FastAPI(lifespan=lifespan)

# Define allowed origins for Cross-Origin Resource Sharing (CORS)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Apply CORS middleware to allow the frontend to communicate with the API
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
    """
    WebSocket endpoint for real-time seat status synchronization.
    Clients connect per trip_id to receive and send seat updates.
    """
    t_id = int(trip_id)
    # Register the new WebSocket connection in the connection manager
    await manager.connect(t_id, websocket)    
    try:
        while True:
            # Receive messages from the client
            data = await websocket.receive_text()
            # Respond to 'ping' with 'pong' to maintain connection heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        # Handle graceful disconnection
        manager.disconnect(t_id, websocket)
    except Exception as e:
        # Log unexpected errors and ensure the connection is cleaned up
        print(f"WebSocket error on trip {t_id}: {e}")
        manager.disconnect(t_id, websocket)

@app.get("/")
def read_root():
    """Health check endpoint to verify API status."""
    return {"success": True, "message": "Bus Booking API is Live"}

# Mount modular routers for different API features
app.include_router(auth.router)      # Authentication and JWT management
app.include_router(trip.router)      # Trip searching and details
app.include_router(seed.router)      # Database seeding utility
app.include_router(user.router)      # User profile management
app.include_router(booking.router)   # Ticket reservations and booking logic
app.include_router(admin.router)     # Administrative dashboard and controls