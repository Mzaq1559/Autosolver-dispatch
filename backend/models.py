import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func, Boolean, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False) # owner, driver, customer
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="customer")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, default="available")
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    
    # Simulation fields
    max_concurrent_orders: Mapped[int] = mapped_column(Integer, default=3)
    current_orders_count: Mapped[int] = mapped_column(Integer, default=0)
    is_in_traffic: Mapped[bool] = mapped_column(Boolean, default=False)
    traffic_delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    last_location_update_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    vehicle_type: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="driver_profile")
    assignments = relationship("Assignment", back_populates="driver")
    orders = relationship("Order", back_populates="driver")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    cuisine_type: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    orders = relationship("Order", back_populates="restaurant")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=True)
    
    pickup_lat: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_lng: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_lat: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_lng: Mapped[float] = mapped_column(Float, nullable=False)
    deadline_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    
    # Simulation fields
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    estimated_pickup_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    estimated_delivery_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    actual_pickup_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    actual_delivery_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    distance_km: Mapped[float] = mapped_column(Float, nullable=True)
    driver_name: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    customer = relationship("User", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    assignments = relationship("Assignment", back_populates="driver") # This seems wrong in original, should be order
    # Correcting relationship to order
    assignments = relationship("Assignment", back_populates="order")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, default="assigned")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="assignments")
    driver = relationship("Driver", back_populates="assignments")