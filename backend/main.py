import asyncio
import math
import json
import socketio
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal, get_db, init_db
from models import Assignment, Driver, Order, User, Restaurant
from simulation_engine import engine as sim_engine
from schemas import (
    AssignmentRead,
    AssignmentRunResponse,
    DriverCreate,
    DriverRead,
    OrderCreate,
    OrderRead,
    UserCreate,
    UserRead,
    UserLogin,
    RestaurantRead,
)
from ws_manager import manager

def seed_drivers():
    db = SessionLocal()
    try:
        existing_driver = db.execute(select(Driver)).scalars().first()
        if existing_driver:
            return
        drivers = [
            Driver(name="Ali", lat=31.5204, lng=74.3587, capacity=2, status="available"),
            Driver(name="Usman", lat=31.5304, lng=74.3687, capacity=2, status="available"),
            Driver(name="Bilal", lat=31.5104, lng=74.3487, capacity=1, status="available"),
        ]
        db.add_all(drivers)
        db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_drivers()
    broadcast_task = asyncio.create_task(broadcast_sim_state())
    yield
    broadcast_task.cancel()

app = FastAPI(
    title="AutoSolver Dispatch API",
    description="FastAPI backend for AI delivery dispatch system.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, socketio_path='simulation/socket.io')
app.mount("/ws", sio_app)

async def broadcast_sim_state():
    """Background task to broadcast simulation state every 2 seconds with compression."""
    while True:
        try:
            if sim_engine.is_running:
                db = SessionLocal()
                try:
                    state = sim_engine.get_sim_state(db)
                    await sio.emit('simulation_state', state, compress=True)
                finally:
                    db.close()
        except Exception as e:
            print(f"Error in broadcast task: {e}")
        await asyncio.sleep(2)

@app.get("/simulation/state")
def get_simulation_state(db: Session = Depends(get_db)):
    return sim_engine.get_sim_state(db)

@app.get("/simulation/stats")
def get_simulation_stats(db: Session = Depends(get_db)):
    return sim_engine.get_stats(db)

@app.post("/simulation/set-speed")
def set_simulation_speed(speed: float):
    sim_engine.set_speed(speed)
    return {"message": f"Speed set to {speed}"}

@app.get("/")
def root():
    return {"message": "AutoSolver API is running"}

@app.post("/simulation/start")
async def start_simulation():
    if sim_engine.is_running:
        return {"message": "Simulation is already running"}
    asyncio.create_task(sim_engine.run())
    return {"message": "Simulation started"}

@app.post("/simulation/pause")
def pause_simulation():
    sim_engine.pause()
    return {"message": "Simulation paused"}

@app.post("/simulation/resume")
def resume_simulation():
    sim_engine.resume()
    return {"message": "Simulation resumed"}

@app.post("/simulation/stop")
def stop_simulation():
    sim_engine.stop()
    return {"message": "Simulation stopped"}

@app.get("/simulation/status")
def get_simulation_status():
    return {
        "is_running": sim_engine.is_running,
        "is_paused": sim_engine._is_paused,
        "current_time": sim_engine.current_time.isoformat(),
        "speed_multiplier": sim_engine.speed_multiplier
    }

@app.post("/auth/register", response_model=UserRead)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.execute(select(User).where(User.email == user_data.email)).scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=user_data.email, password_hash=user_data.password, role=user_data.role, name=user_data.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/auth/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == login_data.email)).scalars().first()
    if not user or user.password_hash != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": user.id, "email": user.email, "role": user.role, "name": user.name, "created_at": user.created_at.isoformat()}

@app.get("/restaurants", response_model=list[RestaurantRead])
def get_restaurants(db: Session = Depends(get_db)):
    result = db.execute(select(Restaurant))
    return result.scalars().all()

@app.get("/customers", response_model=list[UserRead])
def get_customers(db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.role == "customer"))
    return result.scalars().all()

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "order-service"}

@app.get("/drivers", response_model=list[DriverRead])
def get_drivers(db: Session = Depends(get_db)):
    result = db.execute(select(Driver))
    return result.scalars().all()

@app.post("/drivers", response_model=DriverRead, status_code=201)
def create_driver(driver_data: DriverCreate, db: Session = Depends(get_db)):
    driver = Driver(**driver_data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver

@app.post("/orders", response_model=OrderRead, status_code=201)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    order = Order(**order_data.model_dump(), status="pending")
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@app.get("/orders", response_model=list[OrderRead])
def get_orders(db: Session = Depends(get_db)):
    orders = db.execute(select(Order).order_by(Order.created_at.desc())).scalars().all()
    for order in orders:
        if order.customer: order.customer_name = order.customer.name
        if order.restaurant: order.restaurant_name = order.restaurant.name
        if order.driver: order.driver_name = order.driver.name
    return orders

@app.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None: raise HTTPException(status_code=404, detail="Order not found")
    if order.customer: order.customer_name = order.customer.name
    if order.restaurant: order.restaurant_name = order.restaurant.name
    if order.driver: order.driver_name = order.driver.name
    return order

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371
    lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
    delta_lat, delta_lng = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c

def fallback_assign_orders(orders: list[Order], drivers: list[Driver]) -> list[dict]:
    available_drivers = [driver for driver in drivers if driver.status == "available"]
    driver_load = {driver.id: 0 for driver in available_drivers}
    assignment_results = []
    for order in orders:
        best_driver, best_score = None, -1
        for driver in available_drivers:
            if driver_load[driver.id] >= driver.capacity: continue
            distance_to_pickup = haversine_km(order.pickup_lat, order.pickup_lng, driver.lat, driver.lng)
            score = max(0, 100 - distance_to_pickup * 5)
            if score > best_score:
                best_score, best_driver = score, driver
        if best_driver is not None:
            driver_load[best_driver.id] += 1
            assignment_results.append({"order_id": order.id, "driver_id": best_driver.id, "score": round(best_score, 2)})
    return assignment_results

@app.post("/assignments/run", response_model=AssignmentRunResponse)
def run_assignment(db: Session = Depends(get_db)):
    pending_orders = db.execute(select(Order).where(Order.status == "pending")).scalars().all()
    available_drivers = db.execute(select(Driver).where(Driver.status == "available")).scalars().all()
    if not pending_orders: return {"message": "No pending orders to assign.", "created_count": 0, "assignments": []}
    if not available_drivers: return {"message": "No available drivers.", "created_count": 0, "assignments": []}
    assignment_results = fallback_assign_orders(pending_orders, available_drivers)
    created_assignments = []
    for item in assignment_results:
        assignment = Assignment(order_id=item["order_id"], driver_id=item["driver_id"], score=item["score"], status="assigned")
        db.add(assignment)
        order = db.get(Order, item["order_id"])
        if order is not None: order.status = "assigned"
        created_assignments.append(assignment)
    db.commit()
    for assignment in created_assignments: db.refresh(assignment)
    return {"message": f"Created {len(created_assignments)} assignments.", "created_count": len(created_assignments), "assignments": created_assignments}

@app.get("/assignments", response_model=list[AssignmentRead])
def get_assignments(db: Session = Depends(get_db)):
    result = db.execute(select(Assignment).order_by(Assignment.created_at.desc()))
    return result.scalars().all()