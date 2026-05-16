from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # 'owner', 'driver', 'customer'
    name = Column(String)

    # Relationships
    orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="offline") # 'online', 'offline', 'busy'
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    rating = Column(Float, default=5.0)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
    orders = relationship("Order", back_populates="driver")

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)

    # Relationships
    orders = relationship("Order", back_populates="restaurant")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    status = Column(String, default="pending") # 'pending', 'assigned', 'picked_up', 'completed', 'cancelled'
    
    pickup_lat = Column(Float)
    pickup_lng = Column(Float)
    delivery_lat = Column(Float)
    delivery_lng = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])
    driver = relationship("Driver", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
