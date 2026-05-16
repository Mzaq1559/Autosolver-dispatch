from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Driver, Restaurant, Order
import datetime

# Create tables
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists to avoid duplicates
    if db.query(User).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")

    # 1. Users
    # Owner
    owner = User(email="owner@company.com", password_hash="password123", role="owner", name="Main Owner")
    db.add(owner)

    # 3 Drivers
    drivers_list = []
    for i in range(1, 4):
        u = User(email=f"driver{i}@company.com", password_hash="password123", role="driver", name=f"Driver {i}")
        db.add(u)
        drivers_list.append(u)

    # 5 Customers
    for i in range(1, 6):
        u = User(email=f"customer{i}@company.com", password_hash="password123", role="customer", name=f"Customer {i}")
        db.add(u)

    db.commit()

    # 2. Drivers (Profiles)
    # Xinzhou coordinates around 38.41, 112.73
    driver_locations = [
        (38.412, 112.731),
        (38.415, 112.735),
        (38.418, 112.729)
    ]
    
    db_drivers = []
    for i, user in enumerate(drivers_list):
        d = Driver(user_id=user.id, name=user.name, status="available", lat=driver_locations[i][0], lng=driver_locations[i][1], rating=4.8)
        db.add(d)
        db_drivers.append(d)

    # 3. Restaurants in Xinzhou
    restaurant_data = [
        ("Xinzhou Delight", "123 Main St, Xinzhou", 38.410, 112.730),
        ("Shanxi Noodles", "456 North Rd, Xinzhou", 38.414, 112.738),
        ("Golden Dragon", "789 East Ave, Xinzhou", 38.420, 112.740),
        ("Quick Bite", "321 West Blvd, Xinzhou", 38.405, 112.725),
        ("Flavor Town", "654 South St, Xinzhou", 38.411, 112.734)
    ]
    
    db_restaurants = []
    for name, addr, lat, lng in restaurant_data:
        r = Restaurant(name=name, address=addr, lat=lat, lng=lng)
        db.add(r)
        db_restaurants.append(r)

    db.commit()

    # 4. Sample Orders
    # Order 1: Pending
    order1 = Order(
        customer_id=5, # Customer 1 (IDs start at 1, owner is 1, drivers are 2,3,4, customers are 5,6,7,8,9)
        restaurant_id=1,
        status="pending",
        pickup_lat=38.410, pickup_lng=112.730,
        dropoff_lat=38.415, dropoff_lng=112.745,
        deadline_minutes=30,
        price=15.0
    )
    
    # Order 2: Assigned
    order2 = Order(
        customer_id=6,
        driver_id=db_drivers[0].id,
        restaurant_id=2,
        status="assigned",
        pickup_lat=38.414, pickup_lng=112.738,
        dropoff_lat=38.420, dropoff_lng=112.750,
        deadline_minutes=45,
        price=22.5
    )
    
    # Order 3: Completed
    order3 = Order(
        customer_id=7,
        driver_id=db_drivers[1].id,
        restaurant_id=3,
        status="completed",
        pickup_lat=38.420, pickup_lng=112.740,
        dropoff_lat=38.400, dropoff_lng=112.720,
        deadline_minutes=20,
        price=12.0
    )
    
    db.add_all([order1, order2, order3])
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_data()
