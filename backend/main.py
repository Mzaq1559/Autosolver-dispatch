from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal, get_db, init_db
from models import Driver, Order
from schemas import DriverCreate, DriverRead, OrderCreate, OrderRead


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