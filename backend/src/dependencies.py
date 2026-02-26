import os
import redis
import asyncio
import redis.asyncio as aioredis
from fastapi import WebSocket
from typing import Dict, List

# Configuration for Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# Synchronous client for standard key-value operations
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class ConnectionManager:
    """
    Manages active WebSocket connections organized by trip_id.
    Handles connection lifecycle and message broadcasting.
    """
    def __init__(self):
        # Maps trip_id (int) to a list of active WebSocket objects
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        """
        Accepts a new connection and synchronizes the initial seat state from Redis.
        """
        await websocket.accept()
        t_id = int(trip_id)
        
        # Initialize the trip room if it doesn't exist
        if t_id not in self.active_connections:
            self.active_connections[t_id] = []
        self.active_connections[t_id].append(websocket)
        
        # Short pause to ensure connection stability before sync
        await asyncio.sleep(0.1)
        
        try:
            # Sync existing locks: Query Redis for all keys matching 'lock:trip_id:*'
            pattern = f"lock:{t_id}:*"
            keys = redis_client.keys(pattern)
            
            current_locks = []
            for k in keys:
                # Parse key format: 'lock:trip_id:seat_number'
                seat_no = int(k.split(":")[-1])
                owner_id = redis_client.get(k)
                current_locks.append({
                    "seat_no": seat_no,
                    "user_id": int(owner_id) if owner_id else None
                })
            
            # Send the current state of the bus to the newly connected client
            await websocket.send_json({
                "type": "INITIAL_STATE",
                "locked_seats": current_locks
            })
        except Exception as e:
            print(f"Sync Error (Non-fatal): {e}")

    def disconnect(self, trip_id: int, websocket: WebSocket):
        """
        Removes a WebSocket connection from the trip room registry.
        """
        t_id = int(trip_id)
        if t_id in self.active_connections:
            if websocket in self.active_connections[t_id]:
                self.active_connections[t_id].remove(websocket)

    async def broadcast(self, trip_id: int, message: dict):
        """
        Sends a JSON message to all clients currently viewing a specific trip.
        """
        t_id = int(trip_id)
        if t_id in self.active_connections:
            # Iterate over a copy of the list to prevent errors during removals
            for connection in self.active_connections[t_id][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # If sending fails, assume stale connection and disconnect
                    self.disconnect(t_id, connection)

# Global instance of the manager
manager = ConnectionManager()

async def redis_expiration_listener():
    """
    Background task that listens to Redis Keyspace Notifications.
    When a 'lock' key expires, it broadcasts a 'SEAT_UNLOCKED' event via WebSockets.
    """
    # Asynchronous Redis client required for non-blocking Pub/Sub
    async_redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    pubsub = async_redis.pubsub()
    
    # Subscribe to expiration events in Database 0
    await pubsub.psubscribe("__keyevent@0__:expired")
    
    while True:
        try:
            # Check for new messages from Redis with a 1-second timeout
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "pmessage":
                expired_key = message["data"]
                
                # Logic to handle seat hold timeouts
                if expired_key.startswith("lock:"):
                    parts = expired_key.split(":")
                    t_id = int(parts[1])
                    s_no = int(parts[2])
                    
                    # Notify all clients in the trip room to release the visual lock
                    await manager.broadcast(t_id, {
                        "type": "SEAT_UNLOCKED",
                        "seat_no": s_no
                    })
        except Exception as e:
            print(f"Listener Error: {e}")
            # Wait before retrying to prevent rapid-fire error looping
            await asyncio.sleep(5)