from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal, get_db, init_db
from models import Assignment, Driver, Order
from schemas import (
    AssignmentRead,
    AssignmentRunResponse,
    DriverCreate,
    DriverRead,
    OrderCreate,
    OrderRead,
)


def seed_drivers():
    """
    Seed fake drivers into SQLite.

    This keeps the frontend map working, but stores drivers in the database
    instead of a Python list.
    """
    db = SessionLocal()

    try:
        existing_driver = db.execute(select(Driver)).scalars().first()

        if existing_driver:
            return

        drivers = [
            Driver(
                name="Ali",
                lat=31.5204,
                lng=74.3587,
                capacity=2,
                status="available",
            ),
            Driver(
                name="Usman",
                lat=31.5304,
                lng=74.3687,
                capacity=2,
                status="available",
            ),
            Driver(
                name="Bilal",
                lat=31.5104,
                lng=74.3487,
                capacity=1,
                status="available",
            ),
        ]

        db.add_all(drivers)
        db.commit()

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_drivers()
    yield


app = FastAPI(
    title="AutoSolver Dispatch API",
    description="FastAPI backend for AI delivery dispatch system.",
    version="0.1.0",
    lifespan=lifespan,
)


# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AutoSolver API is running"}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "module": "order-service",
    }


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
    order = Order(
        **order_data.model_dump(),
        status="pending",
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


@app.get("/orders", response_model=list[OrderRead])
def get_orders(db: Session = Depends(get_db)):
    result = db.execute(select(Order).order_by(Order.created_at.desc()))
    return result.scalars().all()


@app.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return order
import math


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two geo points in kilometers.

    This is only used for a temporary baseline assignment.
    The final optimization algorithm can replace this later.
    """
    radius = 6371

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def fallback_assign_orders(orders: list[Order], drivers: list[Driver]) -> list[dict]:
    """
    Temporary dispatch baseline.

    This is not the final algorithm.
    It exists so the backend can run end-to-end before the real optimizer is ready.

    Expected output:
    [
        {
            "order_id": 1,
            "driver_id": 3,
            "score": 87.5
        }
    ]
    """
    available_drivers = [driver for driver in drivers if driver.status == "available"]
    driver_load = {driver.id: 0 for driver in available_drivers}

    assignment_results = []

    for order in orders:
        best_driver = None
        best_score = -1

        for driver in available_drivers:
            if driver_load[driver.id] >= driver.capacity:
                continue

            distance_to_pickup = haversine_km(
                order.pickup_lat,
                order.pickup_lng,
                driver.lat,
                driver.lng,
            )

            score = max(0, 100 - distance_to_pickup * 5)

            if score > best_score:
                best_score = score
                best_driver = driver

        if best_driver is not None:
            driver_load[best_driver.id] += 1
            assignment_results.append(
                {
                    "order_id": order.id,
                    "driver_id": best_driver.id,
                    "score": round(best_score, 2),
                }
            )

    return assignment_results


@app.post("/assignments/run", response_model=AssignmentRunResponse)
def run_assignment(db: Session = Depends(get_db)):
    pending_orders = db.execute(
        select(Order).where(Order.status == "pending")
    ).scalars().all()

    available_drivers = db.execute(
        select(Driver).where(Driver.status == "available")
    ).scalars().all()

    if not pending_orders:
        return {
            "message": "No pending orders to assign.",
            "created_count": 0,
            "assignments": [],
        }

    if not available_drivers:
        return {
            "message": "No available drivers.",
            "created_count": 0,
            "assignments": [],
        }

    assignment_results = fallback_assign_orders(pending_orders, available_drivers)

    created_assignments = []

    for item in assignment_results:
        assignment = Assignment(
            order_id=item["order_id"],
            driver_id=item["driver_id"],
            score=item["score"],
            status="assigned",
        )

        db.add(assignment)

        order = db.get(Order, item["order_id"])
        if order is not None:
            order.status = "assigned"

        created_assignments.append(assignment)

    db.commit()

    for assignment in created_assignments:
        db.refresh(assignment)

    return {
        "message": f"Created {len(created_assignments)} assignments.",
        "created_count": len(created_assignments),
        "assignments": created_assignments,
    }


@app.get("/assignments", response_model=list[AssignmentRead])
def get_assignments(db: Session = Depends(get_db)):
    result = db.execute(select(Assignment).order_by(Assignment.created_at.desc()))
    return result.scalars().all()