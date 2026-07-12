from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config.config import settings
from app.api.routes import router as api_router
from app.database.connection import engine, Base, SessionLocal
from app.database.seed import seed_db
from typing import List
import json
import asyncio

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Auto seed database on startup
db = SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI-powered Intelligence Command Center Backend",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow absolute local file paths or arbitrary next.js dev hosts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "KSP Command Center API"}

@app.get("/ready")
def readiness_check():
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")

# ── WEB SOCKETS REAL-TIME ENGINE ──────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                continue

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial confirmation
        await websocket.send_text(json.dumps({"event": "sys:connected", "message": "Command center WS established."}))
        
        while True:
            # Just keep connection open, check for clients ping-pong
            data = await websocket.receive_text()
            # Broadcast back if client sends a broadcast trigger
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task simulator for real-time alerts
@app.on_event("startup")
async def start_realtime_simulator():
    from app.ai.agent_loop import RAGAgentLoop
    db = SessionLocal()
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, RAGAgentLoop.index_database, db)
    finally:
        db.close()

    async def simulate():
        while True:
            await asyncio.sleep(45)
            alert = {
                "event": "alert:new",
                "alert": {
                    "id": "WS_ALERT_" + str(int(asyncio.get_event_loop().time())),
                    "type": "Spike",
                    "severity": "high",
                    "description": "Real-time dispatch advisory: Sudden density activity flagged in central Sector.",
                    "timestamp": "Just Now"
                }
            }
            await manager.broadcast(json.dumps(alert))
            
    asyncio.create_task(simulate())
