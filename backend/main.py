from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import datetime

from .database import engine, Base, get_db
from . import models

# Create tables (though seed.py also does this)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UtoSolver Dispatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class UserBase(BaseModel):
    email: str
    name: str
    role: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class DriverResponse(BaseModel):
    id: int
    user_id: int
    status: str
    current_lat: Optional[float]
    current_lng: Optional[float]
    rating: float
    name: Optional[str] = None

    class Config:
        from_attributes = True

class RestaurantResponse(BaseModel):
    id: int
    name: str
    address: str
    lat: float
    lng: float
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    customer_id: int
    restaurant_id: int
    pickup_lat: float
    pickup_lng: float
    delivery_lat: float
    delivery_lng: float

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    driver_id: Optional[int]
    status: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- Endpoints ---

@app.post("/auth/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password_hash != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user

@app.get("/drivers", response_model=List[DriverResponse])
def get_drivers(db: Session = Depends(get_db)):
    drivers = db.query(models.Driver).all()
    # Add name from User table
    results = []
    for d in drivers:
        d_dict = DriverResponse.from_orm(d)
        d_dict.name = d.user.name
        results.append(d_dict)
    return results

@app.get("/orders", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()

@app.post("/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = models.Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/orders/{id}/assign", response_model=OrderResponse)
def assign_driver(id: int, driver_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db_order.driver_id = driver_id
    db_order.status = "assigned"
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/orders/{id}/status", response_model=OrderResponse)
def update_order_status(id: int, status: str, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/users/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    # For now, return the owner as the default "me" or handle it simply
    # In a real app, this would use JWT
    user = db.query(models.User).filter(models.User.role == "owner").first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/")
def root():
    return {"message": "UtoSolver API is running with SQLite backend"}