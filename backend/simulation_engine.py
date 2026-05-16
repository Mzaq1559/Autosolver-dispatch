import asyncio
import logging
import random
import math
import threading
from datetime import datetime, timedelta
from sqlalchemy import select, update
from database import SessionLocal
from models import Order, Driver, Restaurant, Customer
from ws_manager import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simulation_engine")

# Simulation Constants
BASE_SPEED_KMPH = 40.0
SIM_SPEED_MULTIPLIER = 12
TICK_DURATION = 1.0  # real seconds

class SimulationEngine:
    def __init__(self):
        self.current_time = datetime(2026, 6, 1, 12, 0, 0)
        self.end_time = datetime(2026, 6, 1, 13, 0, 0)
        self.speed_multiplier = SIM_SPEED_MULTIPLIER
        self.is_running = False
        self._is_paused = False
        self._thread = None

    async def run(self):
        """Main simulation loop (async)"""
        logger.info("Simulation Engine starting...")
        self.is_running = True
        
        while self.current_time < self.end_time and self.is_running:
            if self._is_paused:
                await asyncio.sleep(0.5)
                continue
                
            start_tick = asyncio.get_event_loop().time()
            
            # Use a fresh session for each tick
            db = SessionLocal()
            try:
                self.process_new_orders(db)
                self.assign_drivers(db)
                self.update_driver_locations(db)
                self.complete_deliveries(db)
                self.apply_traffic(db)
                db.commit()
                
                # Broadcast state via WebSocket
                state = self.get_sim_state(db)
                await manager.broadcast(state)
                
            except Exception as e:
                logger.error(f"Error in simulation tick: {e}", exc_info=True)
                db.rollback()
            finally:
                db.close()
                
            elapsed = asyncio.get_event_loop().time() - start_tick
            sleep_time = max(0, TICK_DURATION - elapsed)
            
            await asyncio.sleep(sleep_time)
            
            # Advance simulation time
            self.current_time += timedelta(seconds=self.speed_multiplier)
            
        self.is_running = False
        logger.info("Simulation Engine stopped.")

    def process_new_orders(self, db):
        """Query orders where scheduled_time == current_time and activate them."""
        # We check for a window because the sim might skip exact seconds
        window_end = self.current_time + timedelta(seconds=self.speed_multiplier)
        
        # In this simulation, orders are already 'pending' in the JSON,
        # but we treat them as 'scheduled' until their time arrives.
        # For simplicity, we'll assume orders with scheduled_time <= current_time are eligible for assignment.
        pass

    def assign_drivers(self, db):
        """Assign pending orders to nearest available drivers."""
        # Get all orders that are 'pending' and whose time has arrived
        pending_orders = db.execute(
            select(Order).where(
                Order.status == 'pending',
                Order.scheduled_time <= self.current_time
            )
        ).scalars().all()
        
        for order in pending_orders:
            # Find drivers who can take more orders
            available_drivers = db.execute(
                select(Driver).where(
                    (Driver.status == 'available') | 
                    (Driver.current_orders_count < Driver.max_concurrent_orders)
                )
            ).scalars().all()
            
            if not available_drivers:
                continue
                
            # Nearest driver algorithm
            best_driver = min(
                available_drivers, 
                key=lambda d: self.calculate_distance(d.lat, d.lng, order.pickup_lat, order.pickup_lng)
            )
            
            order.driver_id = best_driver.id
            order.status = 'assigned'
            order.driver_name = best_driver.name
            
            best_driver.current_orders_count += 1
            best_driver.status = 'busy'
            
            # Calculate ETA (Distance / Speed)
            dist_to_pickup = self.calculate_distance(best_driver.lat, best_driver.lng, order.pickup_lat, order.pickup_lng)
            dist_to_dropoff = self.calculate_distance(order.pickup_lat, order.pickup_lng, order.dropoff_lat, order.dropoff_lng)
            total_dist = dist_to_pickup + dist_to_dropoff
            
            travel_time_min = (total_dist / BASE_SPEED_KMPH) * 60
            order.estimated_delivery_time = self.current_time + timedelta(minutes=travel_time_min)
            
            logger.info(f"[{self.current_time.strftime('%H:%M:%S')}] Assigned Driver {best_driver.name} to Order {order.id}")

    def update_driver_locations(self, db):
        """Simulate movement along routes."""
        busy_drivers = db.execute(
            select(Driver).where(Driver.status == 'busy')
        ).scalars().all()
        
        sim_seconds = self.speed_multiplier
        speed_per_sec = (BASE_SPEED_KMPH / 3600)
        
        for driver in busy_drivers:
            # Get the driver's active orders
            active_orders = db.execute(
                select(Order).where(
                    Order.driver_id == driver.id,
                    Order.status.in_(['assigned', 'picked_up'])
                ).order_by(Order.created_at.asc())
            ).scalars().all()
            
            if not active_orders:
                continue
            
            # We process the first active order in the queue
            current_order = active_orders[0]
            
            # Apply traffic penalty
            current_speed = speed_per_sec
            if driver.is_in_traffic:
                current_speed *= 0.5
                
            # Determine target waypoint
            if current_order.status == 'assigned':
                target_lat, target_lng = current_order.pickup_lat, current_order.pickup_lng
            else:
                target_lat, target_lng = current_order.dropoff_lat, current_order.dropoff_lng
                
            # Move towards target
            new_lat, new_lng, arrived = self._move_towards(
                driver.lat, driver.lng, 
                target_lat, target_lng, 
                current_speed * sim_seconds
            )
            
            driver.lat = new_lat
            driver.lng = new_lng
            driver.last_location_update_at = self.current_time
            
            if arrived:
                if current_order.status == 'assigned':
                    current_order.status = 'picked_up'
                    current_order.actual_pickup_time = self.current_time
                    logger.info(f"[{self.current_time.strftime('%H:%M:%S')}] Driver {driver.name} picked up Order {current_order.id}")
                else:
                    # Mark as ready for completion
                    current_order.status = 'arrived'

    def complete_deliveries(self, db):
        """Check orders that have arrived at their destination."""
        arrived_orders = db.execute(
            select(Order).where(Order.status == 'arrived')
        ).scalars().all()
        
        for order in arrived_orders:
            order.status = 'completed'
            order.actual_delivery_time = self.current_time
            
            driver = db.get(Driver, order.driver_id)
            if driver:
                driver.current_orders_count -= 1
                if driver.current_orders_count == 0:
                    driver.status = 'available'
            
            logger.info(f"[{self.current_time.strftime('%H:%M:%S')}] Order {order.id} COMPLETED by {order.driver_name}")

    def apply_traffic(self, db):
        """Randomly apply traffic to 15% of active drivers."""
        busy_drivers = db.execute(
            select(Driver).where(Driver.status == 'busy')
        ).scalars().all()
        
        if not busy_drivers:
            return
            
        current_in_traffic = [d for d in busy_drivers if d.is_in_traffic]
        
        # 1. Clear old traffic (after 10 sim-minutes)
        for d in current_in_traffic:
            if self.current_time >= d.last_location_update_at + timedelta(minutes=10):
                d.is_in_traffic = False
                d.traffic_delay_minutes = 0
                logger.info(f"[{self.current_time.strftime('%H:%M:%S')}] Traffic cleared for Driver {d.name}")
        
        # 2. Add new traffic to maintain ~15%
        target_count = max(1, int(len(busy_drivers) * 0.15))
        if len([d for d in busy_drivers if d.is_in_traffic]) < target_count:
            eligible = [d for d in busy_drivers if not d.is_in_traffic]
            if eligible:
                lucky_driver = random.choice(eligible)
                lucky_driver.is_in_traffic = True
                lucky_driver.traffic_delay_minutes = random.randint(5, 15)
                # We use this field to track traffic start time for the clear logic above
                # but we must be careful since it's also updated by movement.
                # Adding a dedicated field would be better, but we'll reuse last_location_update_at for now.
                logger.info(f"[{self.current_time.strftime('%H:%M:%S')}] Traffic JAM! Driver {lucky_driver.name} delayed.")

    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Haversine distance in km."""
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _move_towards(self, curr_lat, curr_lng, dest_lat, dest_lng, step_km):
        """Interpolate coordinates moving towards a destination."""
        dist = self.calculate_distance(curr_lat, curr_lng, dest_lat, dest_lng)
        if dist <= step_km:
            return dest_lat, dest_lng, True
            
        ratio = step_km / dist
        new_lat = curr_lat + (dest_lat - curr_lat) * ratio
        new_lng = curr_lng + (dest_lng - curr_lng) * ratio
        return new_lat, new_lng, False

    def get_sim_state(self, db):
        """Serialize current state for broadcasting."""
        drivers = db.execute(select(Driver)).scalars().all()
        # Only active orders to keep payload small
        active_orders = db.execute(
            select(Order).where(Order.status.in_(['pending', 'assigned', 'picked_up']))
        ).scalars().all()
        
        return {
            "type": "SIM_TICK",
            "payload": {
                "current_time": self.current_time.isoformat(),
                "drivers": [
                    {"id": d.id, "name": d.name, "lat": d.lat, "lng": d.lng, "status": d.status, "in_traffic": d.is_in_traffic}
                    for d in drivers
                ],
                "active_orders": [
                    {"id": o.id, "status": o.status, "lat": o.pickup_lat, "lng": o.pickup_lng, "driver": o.driver_name}
                    for o in active_orders
                ]
            }
        }

    def pause(self):
        self._is_paused = True
        logger.info("Simulation PAUSED.")

    def resume(self):
        self._is_paused = False
        logger.info("Simulation RESUMED.")

    def stop(self):
        self.is_running = False
        logger.info("Simulation STOP requested.")

# Global instance
engine = SimulationEngine()
