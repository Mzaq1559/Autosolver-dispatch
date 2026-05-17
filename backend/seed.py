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

    # 4. Generate 50 realistic orders with random Xinzhou coordinates
    import random

    # Xinzhou city centre: 38.4167, 112.7333 — offsets within ±0.05
    BASE_LAT = 38.4167
    BASE_LNG = 112.7333

    # Realistic Xinzhou pickup landmark pool (name → approx coords)
    pickup_landmarks = [
        ("忻州古城刀削面馆",         38.410, 112.730),
        ("五台山路莜面栲栳栳",         38.414, 112.738),
        ("长征街晋味轩",             38.420, 112.740),
        ("建设路羊杂割馆",            38.405, 112.725),
        ("平阳路烤全羊坊",            38.411, 112.734),
        ("忻州老街豆腐脑店",          38.417, 112.742),
        ("秀容路过油肉面馆",          38.408, 112.729),
        ("和平路晋北风味饺子铺",       38.413, 112.736),
        ("忻府区胡辣汤老店",          38.419, 112.733),
        ("富康路黄河流域烧烤城",       38.422, 112.745),
        ("忻州站前广场小吃街",         38.403, 112.718),
        ("新建路川湘菜馆",            38.416, 112.752),
        ("解放路兰州拉面",            38.421, 112.727),
        ("人民路石锅鱼餐厅",          38.407, 112.741),
        ("鼓楼西街麻辣烫",            38.418, 112.731),
    ]

    # Realistic Xinzhou dropoff district pool
    dropoff_districts = [
        ("建设路居民小区",    38.415, 112.745),
        ("平阳路家园",       38.420, 112.750),
        ("忻州站广场附近",   38.400, 112.720),
        ("秀容路居民区",     38.408, 112.728),
        ("五台山路家园",     38.422, 112.736),
        ("和平路小区",       38.412, 112.743),
        ("富康路花苑",       38.424, 112.748),
        ("忻府区政府附近",   38.416, 112.735),
        ("新建路住宅区",     38.409, 112.756),
        ("解放路沿街公寓",   38.419, 112.724),
        ("人民路学区房",     38.406, 112.738),
        ("鼓楼东街社区",     38.418, 112.744),
        ("忻州一中附近",     38.413, 112.731),
        ("忻州古城景区旁",   38.411, 112.726),
        ("医院路康复小区",   38.403, 112.733),
    ]

    statuses = ["pending", "assigned", "completed"]
    deadlines = [15, 20, 25, 30, 35, 40, 45, 50, 60]
    prices = [10.0, 12.5, 15.0, 18.0, 20.0, 22.5, 25.0, 28.0, 30.0, 32.0, 35.0, 38.0, 42.0, 45.0, 50.0]

    random.seed(42)  # reproducible data

    orders = []
    for i in range(50):
        customer = random.choice(db_customers)
        restaurant = random.choice(db_restaurants)
        status = random.choice(statuses)

        # Pick a landmark and add a small random jitter (±0.008) for variety
        p_name, p_lat_base, p_lng_base = random.choice(pickup_landmarks)
        d_name, d_lat_base, d_lng_base = random.choice(dropoff_districts)

        pickup_lat  = round(p_lat_base  + random.uniform(-0.008, 0.008), 6)
        pickup_lng  = round(p_lng_base  + random.uniform(-0.008, 0.008), 6)
        dropoff_lat = round(d_lat_base  + random.uniform(-0.008, 0.008), 6)
        dropoff_lng = round(d_lng_base  + random.uniform(-0.008, 0.008), 6)

        # Clamp to ±0.05 of city centre
        pickup_lat  = round(max(BASE_LAT - 0.05, min(BASE_LAT + 0.05, pickup_lat)),  6)
        pickup_lng  = round(max(BASE_LNG - 0.05, min(BASE_LNG + 0.05, pickup_lng)),  6)
        dropoff_lat = round(max(BASE_LAT - 0.05, min(BASE_LAT + 0.05, dropoff_lat)), 6)
        dropoff_lng = round(max(BASE_LNG - 0.05, min(BASE_LNG + 0.05, dropoff_lng)), 6)

        driver_id = None
        if status in ("assigned", "completed"):
            driver_id = random.choice(db_drivers).id

        order = Order(
            customer_id=customer.id,
            restaurant_id=restaurant.id,
            driver_id=driver_id,
            status=status,
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
            dropoff_lat=dropoff_lat,
            dropoff_lng=dropoff_lng,
            deadline_minutes=random.choice(deadlines),
            price=random.choice(prices),
        )
        orders.append(order)

    db.add_all(orders)
    db.commit()
    db.close()
    print("Seeding complete — 50 orders created.")

if __name__ == "__main__":
    seed_data()
