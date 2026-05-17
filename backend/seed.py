from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Driver, Restaurant, Order, Customer
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
    owner = User(email="owner@company.com", password_hash="password123", role="owner", name="张老板")
    db.add(owner)

    # 3 Drivers (Xinzhou area delivery riders)
    driver_names = ["王刚", "李明", "赵辉"]
    drivers_list = []
    for i, dname in enumerate(driver_names, start=1):
        u = User(email=f"driver{i}@company.com", password_hash="password123", role="driver", name=dname)
        db.add(u)
        drivers_list.append(u)

    # 5 Customers (Xinzhou residents)
    customer_names = ["刘芳", "陈磊", "杨梅", "吴强", "周静"]
    customer_users = []
    for i, cname in enumerate(customer_names, start=1):
        u = User(email=f"customer{i}@company.com", password_hash="password123", role="customer", name=cname)
        db.add(u)
        customer_users.append(u)

    db.commit()

    # Customer profiles (linked to users, with Xinzhou residential addresses)
    customer_locations = [
        ("刘芳", "138-0351-0001", "忻州市忻府区建设路15号", 38.415, 112.745),
        ("陈磊", "138-0351-0002", "忻州市忻府区平阳路20号", 38.420, 112.750),
        ("杨梅", "138-0351-0003", "忻州市忻府区长征街99号", 38.400, 112.720),
        ("吴强", "138-0351-0004", "忻州市忻府区秀容路88号", 38.408, 112.728),
        ("周静", "138-0351-0005", "忻州市忻府区五台山路42号", 38.422, 112.736),
    ]
    db_customers = []
    for name, phone, addr, lat, lng in customer_locations:
        c = Customer(name=name, phone=phone, address=addr, latitude=lat, longitude=lng)
        db.add(c)
        db_customers.append(c)

    db.commit()

    # 2. Drivers (Profiles)
    # Positions near key Xinzhou districts: 秀容路, 长征街, 五台山路
    driver_locations = [
        (38.412, 112.731),  # near 秀容路 (Xiurong Rd)
        (38.415, 112.735),  # near 长征街 (Changzheng St)
        (38.418, 112.729)   # near 五台山路 (Wutai Mountain Rd)
    ]
    
    db_drivers = []
    for i, user in enumerate(drivers_list):
        d = Driver(user_id=user.id, name=user.name, status="available", lat=driver_locations[i][0], lng=driver_locations[i][1], rating=4.8)
        db.add(d)
        db_drivers.append(d)

    # 3. Restaurants in Xinzhou
    restaurant_data = [
        ("忻州古城刀削面馆", "忻州市忻府区秀容路12号", 38.410, 112.730),
        ("五台山路莜面栲栳栳", "忻州市忻府区五台山路88号", 38.414, 112.738),
        ("长征街晋味轩", "忻州市忻府区长征街56号", 38.420, 112.740),
        ("建设路羊杂割馆", "忻州市忻府区建设路33号", 38.405, 112.725),
        ("平阳路烤全羊坊", "忻州市忻府区平阳路101号", 38.411, 112.734)
    ]
    
    db_restaurants = []
    for name, addr, lat, lng in restaurant_data:
        r = Restaurant(name=name, address=addr, lat=lat, lng=lng)
        db.add(r)
        db_restaurants.append(r)

    db.commit()

    # 4. Sample Orders — customer_id maps to Customer table (db_customers list, 0-indexed)
    # Order 1: Pending — pickup: 忻州古城刀削面馆 (秀容路12号), dropoff: 建设路小区 (刘芳)
    order1 = Order(
        customer_id=db_customers[0].id,  # 刘芳
        restaurant_id=db_restaurants[0].id,
        status="pending",
        pickup_lat=38.410, pickup_lng=112.730,   # 秀容路 (Xiurong Rd)
        dropoff_lat=38.415, dropoff_lng=112.745,  # 建设路居民区 (Jianshe Rd Residential)
        deadline_minutes=30,
        price=15.0
    )

    # Order 2: Assigned — pickup: 五台山路莜面栲栳栳 (五台山路88号), dropoff: 平阳路附近 (陈磊)
    order2 = Order(
        customer_id=db_customers[1].id,  # 陈磊
        driver_id=db_drivers[0].id,
        restaurant_id=db_restaurants[1].id,
        status="assigned",
        pickup_lat=38.414, pickup_lng=112.738,   # 五台山路 (Wutai Mountain Rd)
        dropoff_lat=38.420, dropoff_lng=112.750,  # 平阳路小区 (Pingyang Rd Residential)
        deadline_minutes=45,
        price=22.5
    )

    # Order 3: Completed — pickup: 长征街晋味轩 (长征街56号), dropoff: 忻州火车站附近 (杨梅)
    order3 = Order(
        customer_id=db_customers[2].id,  # 杨梅
        driver_id=db_drivers[1].id,
        restaurant_id=db_restaurants[2].id,
        status="completed",
        pickup_lat=38.420, pickup_lng=112.740,   # 长征街 (Changzheng St)
        dropoff_lat=38.400, dropoff_lng=112.720,  # 忻州站广场 (Xinzhou Railway Station Square)
        deadline_minutes=20,
        price=12.0
    )

    # Order 4: Pending — pickup: 建设路羊杂割馆, dropoff: 五台山路附近 (吴强)
    order4 = Order(
        customer_id=db_customers[3].id,  # 吴强
        restaurant_id=db_restaurants[3].id,
        status="pending",
        pickup_lat=38.405, pickup_lng=112.725,   # 建设路 (Jianshe Rd)
        dropoff_lat=38.408, dropoff_lng=112.728,  # 秀容路居民区
        deadline_minutes=25,
        price=18.0
    )

    # Order 5: Assigned — pickup: 平阳路烤全羊坊, dropoff: 长征街附近 (周静)
    order5 = Order(
        customer_id=db_customers[4].id,  # 周静
        driver_id=db_drivers[2].id,
        restaurant_id=db_restaurants[4].id,
        status="assigned",
        pickup_lat=38.411, pickup_lng=112.734,   # 平阳路 (Pingyang Rd)
        dropoff_lat=38.422, dropoff_lng=112.736,  # 五台山路居民区
        deadline_minutes=35,
        price=32.0
    )

    db.add_all([order1, order2, order3, order4, order5])
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_data()
