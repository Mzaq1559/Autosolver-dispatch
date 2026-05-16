# AutoSolver — AI Delivery Dispatch System

A high-performance, real-time logistics platform for automated driver assignment, dynamic traffic simulation, and delivery tracking.

---

## Project Overview

**AutoSolver** is a comprehensive logistics management system designed to streamline the complex process of delivery dispatching. In many logistics operations, manual dispatching is a bottleneck that leads to delays and inefficiency. AutoSolver solves this by providing an automated, algorithm-driven engine that matches orders with drivers in real-time.

Built for scalability and performance, the system can handle up to **10,000 concurrent orders** while maintaining a smooth 60FPS user experience. It features a sophisticated simulation engine that replicates a full hour of delivery operations, complete with dynamic traffic conditions and real-time movement tracking.

This project is ideal for logistics startups, fleet managers, and developers looking to understand real-time geospatial applications.

## Features

-   **Real-time Simulation Engine**: Simulates delivery operations with adjustable speed multipliers (default 12x).
-   **Automated Driver Assignment**: Uses a nearest-neighbor algorithm based on Haversine distance to optimize delivery routes.
-   **Dynamic Traffic Simulation**: Randomly applies traffic delays to 15% of active drivers to mimic real-world unpredictability.
-   **Multi-Role Dashboards**:
    -   **Owner Dashboard**: High-level analytics, live map tracking of all drivers, and simulation controls.
    -   **Driver Dashboard**: Order management and route visualization.
    -   **Customer Dashboard**: Real-time tracking of personal orders.
-   **Performance Optimized**: Utilizes list virtualization (React Window) and marker clustering to support 10,000+ active orders.
-   **Live Analytics**: Interactive charts powered by Recharts showing delivery times, orders per minute, and status distribution.
-   **WebSocket Integration**: Real-time state broadcasting for instant UI updates.

## Technology Stack

### Frontend
-   **Framework**: React 19 (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Maps**: Leaflet & React-Leaflet
-   **Animations**: Framer Motion
-   **Charts**: Recharts
-   **Real-time**: Socket.io-client
-   **Optimization**: React Window (Virtualization)

### Backend
-   **Framework**: FastAPI (Python)
-   **Database**: SQLite with SQLAlchemy ORM
-   **Real-time**: Python-SocketIO (WebSockets)
-   **Simulation**: Custom Async Simulation Engine

## Project Structure

```bash
utosolver-dispatch/
├── backend/                # FastAPI application
│   ├── main.py             # API entry point & routes
│   ├── models.py           # SQLAlchemy database models
│   ├── simulation_engine.py # Core simulation logic
│   ├── ws_manager.py       # WebSocket connection handler
│   ├── schemas.py          # Pydantic models
│   └── seed.py             # Database seeding scripts
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Map, Panels)
│   │   ├── pages/          # Role-based dashboards
│   │   ├── context/        # Auth and Simulation contexts
│   │   └── services/       # API and WebSocket services
│   └── tailwind.config.js  # Styling configuration
└── docs/                   # Project documentation
```

## Installation & Setup

### Prerequisites
-   Python 3.10+
-   Node.js 18+
-   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Mzaq1559/utosolver-dispatch.git
cd utosolver-dispatch
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## How It Works

### System Workflow
1.  **Initialization**: The backend seeds the database with drivers, restaurants, and scheduled orders.
2.  **Simulation Loop**: The `SimulationEngine` runs an asynchronous loop. Every "tick", it:
    -   Spawns orders scheduled for the current simulation time.
    -   Assigns the nearest available driver to pending orders.
    -   Calculates ETAs and moves drivers toward their destinations.
    -   Injects random traffic delays.
3.  **Real-time Broadcast**: The state of all drivers and orders is compressed and broadcasted via WebSockets every 2 seconds.
4.  **UI Rendering**: The frontend receives the state, updates the Leaflet map, and refreshes the analytics charts.

### Key Logic
-   **Assignment**: Drivers are selected based on proximity and current load capacity.
-   **Movement**: Coordinate interpolation ensures smooth driver movement on the map between simulation ticks.

## Example Usage

### Dashboard Preview
The Owner Dashboard provides a bird's-eye view of the entire fleet:
-   **Live Map**: Watch drivers move in real-time.
-   **Control Bar**: Start, Pause, and adjust the simulation speed.
-   **Statistics**: View "Orders Per Minute" and "Average Delivery Time" dynamically.

*(Insert screenshots here)*

### API Example
To manually start the simulation:
```bash
curl -X POST http://localhost:8000/simulation/start
```

## Future Improvements

-   **Advanced Routing**: Integration with OSRM or Google Maps API for street-level pathfinding.
-   **Predictive AI**: Use historical data to predict peak hours and pre-position drivers.
-   **Mobile App**: A dedicated React Native app for drivers to receive push notifications.
-   **Multi-City Support**: Scaling the simulation to handle multiple geographic regions simultaneously.

## Contributors

-   **Zulqarnain (Mzaq1559)** - Lead Developer & Architect

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.