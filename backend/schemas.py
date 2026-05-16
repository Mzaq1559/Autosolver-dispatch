from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DriverStatus = Literal["available", "busy", "offline", "idle"]
OrderStatus = Literal["pending", "assigned", "picked_up", "delivering", "completed", "cancelled"]
AssignmentStatus = Literal["assigned", "accepted", "rejected", "completed"]


class UserBase(BaseModel):
    email: str
    name: str
    role: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: str
    password: str


class RestaurantRead(BaseModel):
    id: int
    name: str
    address: str
    lat: float
    lng: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    capacity: int = Field(default=1, ge=1, le=10)
    status: DriverStatus = "available"


class DriverRead(BaseModel):
    id: int
    user_id: int | None = None
    name: str
    lat: float
    lng: float
    capacity: int
    status: DriverStatus
    rating: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    pickup_lat: float = Field(ge=-90, le=90)
    pickup_lng: float = Field(ge=-180, le=180)
    dropoff_lat: float = Field(ge=-90, le=90)
    dropoff_lng: float = Field(ge=-180, le=180)
    deadline_minutes: int = Field(gt=0, le=240)
    price: float = Field(ge=0)


class OrderRead(BaseModel):
    id: int
    customer_id: int | None = None
    driver_id: int | None = None
    restaurant_id: int | None = None
    customer_name: str | None = "Unknown Customer"
    restaurant_name: str | None = "Unknown Restaurant"
    driver_name: str | None = None
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float
    deadline_minutes: int
    price: float
    status: OrderStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignmentRead(BaseModel):
    id: int
    order_id: int
    driver_id: int
    score: float
    status: AssignmentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignmentRunResponse(BaseModel):
    message: str
    created_count: int
    assignments: list[AssignmentRead]