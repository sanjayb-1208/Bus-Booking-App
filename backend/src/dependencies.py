import os
import redis
import asyncio
import redis.asyncio as aioredis
from fastapi import WebSocket
from typing import Dict, List

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        await websocket.accept()
        t_id = int(trip_id)
        if t_id not in self.active_connections:
            self.active_connections[t_id] = []
        self.active_connections[t_id].append(websocket)
        await asyncio.sleep(0.1)
        
        try:
            pattern = f"lock:{t_id}:*"
            keys = redis_client.keys(pattern)
            
            current_locks = []
            for k in keys:
                seat_no = int(k.split(":")[-1])
                owner_id = redis_client.get(k)
                current_locks.append({
                    "seat_no": seat_no,
                    "user_id": int(owner_id) if owner_id else None
                })
            
            await websocket.send_json({
                "type": "INITIAL_STATE",
                "locked_seats": current_locks
            })
        except Exception as e:
            print(f"Sync Error (Non-fatal): {e}")

    def disconnect(self, trip_id: int, websocket: WebSocket):
        t_id = int(trip_id)
        if t_id in self.active_connections:
            if websocket in self.active_connections[t_id]:
                self.active_connections[t_id].remove(websocket)

    async def broadcast(self, trip_id: int, message: dict):
        t_id = int(trip_id)
        if t_id in self.active_connections:
            for connection in self.active_connections[t_id][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(t_id, connection)

manager = ConnectionManager()

async def redis_expiration_listener():
    async_redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    pubsub = async_redis.pubsub()
    await pubsub.psubscribe("__keyevent@0__:expired")
    
    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "pmessage":
                expired_key = message["data"]
                if expired_key.startswith("lock:"):
                    parts = expired_key.split(":")
                    t_id = int(parts[1])
                    s_no = int(parts[2])
                    await manager.broadcast(t_id, {
                        "type": "SEAT_UNLOCKED",
                        "seat_no": s_no
                    })
        except Exception as e:
            print(f"Listener Error: {e}")
            await asyncio.sleep(5)