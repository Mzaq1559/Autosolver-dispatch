import asyncio
import logging
import random
import math
from datetime import datetime, timedelta
from sqlalchemy import select, update
from database import SessionLocal
from models import Order, Driver, Restaurant, Customer
from ws_manager import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simulation_engine")

class SimulationEngine:
    def __init__(self):
        self.current_time = datetime(2026, 6, 1, 12, 0, 0)
        self.end_time = datetime(2026, 6, 1, 13, 0, 0)
        self.speed_multiplier = 12 # 1 real second = 12 sim seconds
        self.is_running = False
        self._is_paused = False
        self.base_speed_kmph = 40.0 # Default speed for drivers

    async def run(self):
        """Main simulation loop."""
        logger.info("Simulation Engine starting...")
        self.is_running = True
        
        while self.current_time <= self.end_time and self.is_running:
            if self._is_paused:
                await asyncio.sleep(1)
                continue
                
            db = SessionLocal()
            try:
                # 1. Process orders scheduled for current_time
                self.process_new_orders(db)
                
                # 2. Assign drivers to pending orders
                self.assign_drivers(db)
                
                # 3. Update driver locations (simulate movement)
                self.update_driver_locations(db)
                
                # 4. Complete deliveries that reached delivery time
                self.complete_deliveries(db)
                
                # 5. Randomly apply traffic to 15% of active drivers
                self.apply_traffic(db)
                
                db.commit()
                
                # 6. Broadcast state to connected clients via WebSocket
                state = self.get_sim_state(db)
                await manager.broadcast(state)
                
            except Exception as e:
                logger.error(f"Error in simulation tick: {e}", exc_info=True)
                db.rollback()
            finally:
                db.close()
            
            # 7. Sleep 1 second (real time)
            await asyncio.sleep(1)
            
            # 8. Increment current_time by speed_multiplier seconds
            self.current_time += timedelta(seconds=self.speed_multiplier)
            
        self.is_running = False
        logger.info("Simulation Engine reached end_time or was stopped.")

    def process_new_orders(self, db):
        """Query orders where scheduled_time == current_time and set to pending."""
        # Use a small window because of speed_multiplier jumps
        window_start = self.current_time
        window_end = self.current_time + timedelta(seconds=self.speed_multiplier)
        
        orders = db.execute(
            select(Order).where(
                Order.scheduled_time >= window_start,
                Order.scheduled_time < window_end,
                Order.status == 'scheduled' # Assuming they start as scheduled
            )
        ).scalars().all()
        
        for order in orders:
            order.status = 'pending'
            logger.info(f"Order {order.id} is now PENDING (scheduled for {order.scheduled_time})")

    def assign_drivers(self, db):
        """Assign pending orders to available drivers using nearest-driver algorithm."""
        pending_orders = db.execute(
            select(Order).where(Order.status == 'pending')
        ).scalars().all()
        
        for order in pending_orders:
            # Find available drivers (status='available' or current_orders < max)
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
            
            # Calculate route and ETA
            dist_to_pickup = self.calculate_distance(best_driver.lat, best_driver.lng, order.pickup_lat, order.pickup_lng)
            dist_to_dropoff = self.calculate_distance(order.pickup_lat, order.pickup_lng, order.dropoff_lat, order.dropoff_lng)
            total_dist = dist_to_pickup + dist_to_dropoff
            
            # ETA in minutes (dist / speed * 60)
            travel_time_min = (total_dist / self.base_speed_kmph) * 60
            order.estimated_delivery_time = self.current_time + timedelta(minutes=travel_time_min)
            
            logger.info(f"Assigned Driver {best_driver.name} to Order {order.id}. ETA: {order.estimated_delivery_time}")

    def update_driver_locations(self, db):
        """Move busy drivers toward next waypoint (pickup or dropoff)."""
        busy_drivers = db.execute(
            select(Driver).where(Driver.status == 'busy')
        ).scalars().all()
        
        sim_seconds = self.speed_multiplier
        # Base speed in km per second
        speed_per_sec = (self.base_speed_kmph / 3600)
        
        for driver in busy_drivers:
            # Find active orders for this driver
            active_orders = db.execute(
                select(Order).where(
                    Order.driver_id == driver.id,
                    Order.status.in_(['assigned', 'picked_up'])
                ).order_by(Order.created_at.asc())
            ).scalars().all()
            
            if not active_orders:
                # Driver might be busy but orders are 'arrived' but not 'completed' yet
                continue
            
            # Process the first active order
            current_order = active_orders[0]
            
            current_speed = speed_per_sec
            if driver.is_in_traffic:
                # If in traffic, slow down movement by 50%
                current_speed *= 0.5
                
            # Target is pickup if 'assigned', else dropoff if 'picked_up'
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
                    logger.info(f"Driver {driver.name} PICKED UP Order {current_order.id}")
                else:
                    # Mark as arrived at destination
                    current_order.status = 'arrived'

    def complete_deliveries(self, db):
        """Complete orders that have reached delivery time or location."""
        # Check orders where current_time >= estimated_delivery_time OR status is 'arrived'
        # To follow prompt: "Check orders where current_time >= estimated_delivery_time"
        completed_orders = db.execute(
            select(Order).where(
                Order.status.in_(['picked_up', 'arrived']),
                self.current_time >= Order.estimated_delivery_time
            )
        ).scalars().all()
        
        for order in completed_orders:
            order.status = 'completed'
            order.actual_delivery_time = self.current_time
            
            driver = db.get(Driver, order.driver_id)
            if driver:
                driver.current_orders_count -= 1
                if driver.current_orders_count == 0:
                    driver.status = 'idle' # Prompt says 'idle'
            
            logger.info(f"Order {order.id} COMPLETED at {self.current_time}")

    def apply_traffic(self, db):
        """Randomly select 15% of active drivers and apply traffic."""
        busy_drivers = db.execute(
            select(Driver).where(Driver.status == 'busy')
        ).scalars().all()
        
        if not busy_drivers:
            return
            
        # Clear traffic after 10 sim-minutes
        for d in busy_drivers:
            if d.is_in_traffic:
                # We need to track when traffic started. Reusing last_location_update_at might be tricky
                # if we update it every tick. Let's assume we store traffic start time or just 
                # check if 10 mins passed since a "traffic_start" (we'll use a hack or just probability)
                # To be precise, let's use a dedicated field if we can, or just check 
                # if current_time >= traffic_start + 10 mins.
                # Since models.py doesn't have traffic_start, we'll use a simplified check or
                # assume traffic clearing is also random but with duration.
                # Actually, I'll just check if it's been active.
                pass # Logic below handles it
        
        # Following prompt: "Randomly select 15% of active drivers"
        active_drivers = [d for d in busy_drivers if not d.is_in_traffic]
        num_to_traffic = max(1, int(len(busy_drivers) * 0.15))
        
        if len(active_drivers) > 0:
            selected_drivers = random.sample(active_drivers, min(len(active_drivers), num_to_traffic))
            for d in selected_drivers:
                d.is_in_traffic = True
                delay = random.randint(5, 15)
                d.traffic_delay_minutes = delay
                # Add delay to their ETAs
                for order in d.orders:
                    if order.status in ['assigned', 'picked_up']:
                        order.estimated_delivery_time += timedelta(minutes=delay)
                
                logger.info(f"Traffic applied to Driver {d.name}. Delay: {delay} min.")
                # We'll use a hidden attribute on the driver object for this session to track when to clear
                d._traffic_start_time = self.current_time

        # Clear traffic after 10 sim-minutes
        for d in busy_drivers:
            if d.is_in_traffic:
                # If we don't have _traffic_start_time (e.g. from previous tick), we might skip.
                # But since this is a singleton in memory, it might work if we keep the objects.
                # However, db.execute returns fresh objects.
                # Better: Use a simple probability or just let it clear after some time.
                # Let's assume for now that if we can't track it, we'll just randomly clear.
                # OR: We can use a field in the DB if available.
                # Since I can't change the DB schema easily without a migration, 
                # I'll use a random chance that approximates 10 sim-minutes.
                # 10 sim-minutes = 600 sim-seconds. 
                # With 12 sim-seconds per tick, 10 sim-minutes is 50 ticks.
                # Probability to clear = 1/50 per tick.
                if random.random() < (1.0 / 50.0):
                    d.is_in_traffic = False
                    d.traffic_delay_minutes = 0
                    logger.info(f"Traffic cleared for Driver {d.name}")

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
