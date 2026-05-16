import json
import random
import math
from datetime import datetime, timedelta

# Xinzhou Constants
CITY_CENTER_LAT = 38.4167
CITY_CENTER_LNG = 112.7333
CITY_RADIUS = 0.08  # ~8km

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles. Determines return value units.
    return c * r

def generate_random_location(center_lat, center_lng, radius):
    """Generates random lat/lng within a circular area."""
    # We use a simple square approximation for radius in degrees since 0.08 is small
    # For better accuracy we could use polar coordinates but this is sufficient for simulation
    u = random.random()
    v = random.random()
    w = radius * math.sqrt(u)
    t = 2 * math.pi * v
    x = w * math.cos(t)
    y = w * math.sin(t)
    
    # Adjust for longitude shrink due to latitude
    x_adj = x / math.cos(math.radians(center_lat))
    
    return center_lat + y, center_lng + x_adj

# Data pools
SURNAMES = ["王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"]
GIVEN_NAMES = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞"]
CUISINE_TYPES = ["川菜", "鲁菜", "粤菜", "湘菜", "晋菜", "火锅", "烧烤", "快餐", "披萨", "奶茶", "面食"]
STREETS = ["忻府大街", "建设北路", "和平西街", "光明路", "云中路", "七一北路", "长征街", "公园东街", "健康路", "利民西街"]
DISTRICTS = ["忻府区"]

RESTAURANT_NAMES = [
    "肯德基 (KFC)", "麦当劳 (McDonald's)", "必胜客", "老北京炸酱面", "忻州羊杂割", 
    "大槐树饺子馆", "海底捞火锅", "真功夫", "沙县小吃", "兰州拉面", 
    "黄焖鸡米饭", "正新鸡排", "喜茶", "奈雪的茶", "蜜雪冰城", 
    "老西醋坊", "代县熬鱼", "繁峙疤饼", "定襄蒸肉", "五台山豆腐丸子",
    "山西过油肉", "刀削面大王", "剔尖面馆", "烤鱼吧", "麻辣烫",
    "石锅鱼", "重庆小面", "张亮麻辣烫", "杨国福", "德克士",
    "华莱士", "汉堡王", "星巴克", "瑞幸咖啡", "一点点",
    "古茗", "茶百道", "书亦烧仙草", "沪上阿姨", "霸王茶姬",
    "桥头排骨", "绝味鸭脖", "周黑鸭", "串串香", "纸上烤肉",
    "自助海鲜", "日料馆", "韩式炸鸡", "披萨玛尚诺", "泰式餐厅"
]

def generate_chinese_name():
    return random.choice(SURNAMES) + random.choice(GIVEN_NAMES)

def generate_address():
    street = random.choice(STREETS)
    num = random.randint(1, 500)
    return f"山西省忻州市{random.choice(DISTRICTS)}{street}{num}号"

def generate_phone():
    return f"1{random.choice(['3', '5', '7', '8', '9'])}{random.randint(100000000, 999999999)}"

def generate_data():
    # 1. Restaurants
    restaurants = []
    for i in range(1, 51):
        lat, lng = generate_random_location(CITY_CENTER_LAT, CITY_CENTER_LNG, CITY_RADIUS)
        name = RESTAURANT_NAMES[i-1] if i-1 < len(RESTAURANT_NAMES) else f"餐厅_{i}"
        restaurants.append({
            "id": i,
            "name": name,
            "address": generate_address(),
            "lat": lat,
            "lng": lng,
            "cuisine_type": random.choice(CUISINE_TYPES)
        })

    # 2. Customers
    customers = []
    for i in range(1, 5001):
        lat, lng = generate_random_location(CITY_CENTER_LAT, CITY_CENTER_LNG, CITY_RADIUS)
        customers.append({
            "id": i,
            "name": generate_chinese_name(),
            "phone": generate_phone(),
            "address": generate_address(),
            "lat": lat,
            "lng": lng
        })

    # 3. Drivers
    drivers = []
    for i in range(1, 101):
        lat, lng = generate_random_location(CITY_CENTER_LAT, CITY_CENTER_LNG, CITY_RADIUS)
        status = "idle" if random.random() < 0.8 else "busy"
        drivers.append({
            "id": i,
            "name": generate_chinese_name(),
            "phone": generate_phone(),
            "vehicle_type": random.choice(["E-Bike", "Motorcycle"]),
            "status": status,
            "current_lat": lat,
            "current_lng": lng,
            "max_concurrent_orders": random.randint(2, 4),
            "current_orders_count": 0
        })

    # 4. Orders
    orders = []
    start_time = datetime(2026, 6, 1, 12, 0, 0)
    end_time = datetime(2026, 6, 1, 13, 0, 0)
    
    for i in range(1, 10001):
        # Triangular distribution: peak at 12:30 (0.5 hour mark)
        # random.triangular(low, high, mode)
        minutes_offset = random.triangular(0, 60, 30)
        scheduled_time = start_time + timedelta(minutes=minutes_offset)
        
        restaurant = random.choice(restaurants)
        customer = random.choice(customers)
        
        dist_km = haversine(restaurant["lat"], restaurant["lng"], customer["lat"], customer["lng"])
        # Base time 10 min + 5 min per km + random 5-10 min buffer
        eta = 10 + (dist_km * 5) + random.uniform(5, 10)
        eta = max(15, min(45, int(eta))) # Clamp between 15-45 as requested
        
        orders.append({
            "id": i,
            "restaurant_id": restaurant["id"],
            "customer_id": customer["id"],
            "scheduled_time": scheduled_time.isoformat(),
            "pickup_lat": restaurant["lat"],
            "pickup_lng": restaurant["lng"],
            "delivery_lat": customer["lat"],
            "delivery_lng": customer["lng"],
            "status": "pending",
            "total_price": round(random.uniform(30, 200), 2),
            "estimated_delivery_minutes": eta
        })

    # Save to files
    with open("restaurants.json", "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    with open("customers.json", "w", encoding="utf-8") as f:
        json.dump(customers, f, ensure_ascii=False, indent=2)
        
    with open("drivers.json", "w", encoding="utf-8") as f:
        json.dump(drivers, f, ensure_ascii=False, indent=2)
        
    with open("orders.json", "w", encoding="utf-8") as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(restaurants)} restaurants")
    print(f"Generated {len(customers)} customers")
    print(f"Generated {len(drivers)} drivers")
    print(f"Generated {len(orders)} orders")

if __name__ == "__main__":
    generate_data()
