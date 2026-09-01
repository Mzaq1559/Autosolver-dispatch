# 🚚 AutoSolver — AI Delivery Dispatch System

![React](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-green.svg?style=flat&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=flat&logo=python)
![SQLite](https://img.shields.io/badge/SQLite-Database-lightgrey.svg?style=flat&logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**AutoSolver** is a high-performance, real-time logistics platform designed for automated driver assignment, dynamic traffic simulation, and delivery tracking. It addresses the manual dispatching bottleneck through an algorithm-driven simulation engine.

The system simulates a delivery ecosystem in Lahore and manages the complete lifecycle of delivery orders, including scheduling, driver assignment, real-time movement, traffic effects, and delivery completion.

---

## ✨ Features

- ⏱️ **Time-Warped Simulation**: Simulates approximately 1 hour of delivery operations in around 5 minutes. The simulation speed multiplier is highly configurable (default 12×).
- 🧠 **Intelligent Dispatching**: Automatically assigns pending orders to nearby available drivers using a Haversine-based distance and scoring logic, with driver capacity management.
- 🗺️ **Real-Time Visualization**: An interactive map interface featuring pulsing driver markers, delivery destinations, active routes, and live simulation state.
- 🚦 **Dynamic Traffic Effects**: Injects stochastic traffic events that realistically reduce driver speed by 50% and dynamically update ETAs.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: React Hooks & Context API
- **Maps & Visualization**: Leaflet, React-Leaflet, Marker Clustering
- **UI & Animations**: Framer Motion, Recharts, React Window
- **Networking**: Axios, Native WebSockets

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Real-Time Communication**: Native WebSockets via FastAPI
- **Engine**: Custom asynchronous Python simulation engine

---

## 🏗️ Architecture

### 1. Simulation Engine (`simulation_engine.py`)
The heart of the platform. It runs a non-blocking/asynchronous simulation loop that:
- Handles scheduled order spawning.
- Computes driver movement using coordinate interpolation.
- Injects stochastic traffic effects impacting 15% of active drivers.
- Manages the entire order lifecycle.
- Computes real-time statistics (e.g., total orders, active deliveries, average delivery time, orders per minute).

### 2. API Layer (`main.py`)
A comprehensive REST API providing:
- **Authentication**: Role-based access for Owners, Drivers, and Customers.
- **Data Management**: CRUD operations for drivers, orders, and restaurants.
- **Simulation Control**: Endpoints to start, pause, resume, stop, and set the simulation speed.

### 3. Real-Time Communication
The backend utilizes standard WebSockets to synchronize the frontend with the simulation engine. State updates are broadcasted to the frontend at every simulation tick, ensuring the interactive dashboards and map remain perfectly in sync with the backend.

---

## ⚙️ How the System Works

1. An order is created or scheduled via the API or UI.
2. The simulation engine processes pending orders.
3. Available drivers are evaluated based on their distance and current order capacity.
4. The assignment algorithm selects an appropriate nearby driver for the order.
5. The assigned driver begins moving toward the pickup and then the drop-off destination.
6. Traffic events may randomly occur, reducing movement speed and recalculating the ETA.
7. The backend broadcasts the live state (driver coordinates, order statuses, stats) via WebSockets.
8. The frontend dashboard updates in real time to visualize the progress.
9. The order eventually reaches its delivered/completed state.

---

## 🧮 Algorithm Details

- **Haversine Distance**: Calculates the precise geographic distance (in km) between coordinates.
- **Nearest-Driver Selection**: Evaluates drivers by combining distance and capacity, assigning a score using `max(0, 100 - distance * 5)` to pick the optimal driver.
- **Driver Capacity Handling**: Ensures drivers are only assigned orders if their `current_orders_count` is less than their `max_concurrent_orders`.
- **Coordinate Interpolation**: Interpolates the geographic coordinates of drivers on their route based on their simulated speed and elapsed time.
- **Traffic Simulation**: Periodically selects a portion of active drivers (up to 15%) to be caught in traffic, reducing their simulated travel speed by 50% and accurately extending the order ETA.
- **Simulation Time Scaling**: Advances logical simulation time independently of wall-clock time by applying a configurable multiplier.

---

## 📂 Project Structure

```text
AutoSolver/
├── backend/
│   ├── database.py          # Database setup and session management
│   ├── main.py              # FastAPI application and REST endpoints
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic schemas for data validation
│   ├── simulation_engine.py # Core asynchronous simulation loop
│   └── ws_manager.py        # WebSocket connection manager
├── frontend/
│   ├── package.json         # Frontend dependencies and scripts
│   ├── src/                 # React source code and components
│   └── vite.config.ts       # Vite configuration
└── README.md
```

---

## 📡 API Documentation

### Authentication & Users
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/customers` | List all customers |

### Simulation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/simulation/state` | Get current simulation state |
| `GET` | `/simulation/stats` | Get aggregate simulation statistics |
| `GET` | `/simulation/status` | Get running/paused status and speed |
| `POST` | `/simulation/start` | Start the simulation engine |
| `POST` | `/simulation/pause` | Pause the simulation |
| `POST` | `/simulation/resume`| Resume the simulation |
| `POST` | `/simulation/stop`  | Stop the simulation |
| `POST` | `/simulation/set-speed`| Set simulation speed multiplier |

### Drivers & Orders
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/drivers` | List all drivers and their status |
| `POST` | `/drivers` | Create a new driver |
| `GET` | `/orders` | List delivery orders |
| `POST` | `/orders` | Create a delivery order |
| `GET` | `/orders/{order_id}`| Get order details by ID |
| `GET` | `/restaurants` | List all restaurants |

### Assignments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/assignments/run` | Manually trigger the assignment algorithm |
| `GET` | `/assignments` | List all generated assignments |

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv

# Linux/macOS:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```
The frontend UI will be accessible locally, usually at `http://localhost:5173`.

---

## 📊 Current Progress

### ✅ Completed / Functional
- Database schema and ORM models
- Asynchronous simulation engine
- Automated driver assignment with capacity constraints
- Real-time dashboards and visualization
- Authentication with role-based access
- Route visualization using Leaflet

### 🗺️ Roadmap
- Advanced routing using OSRM/Google Maps
- Predictive demand analysis
- React Native driver application
- Multi-region simulation

---

## 🎓 Academic Context

AutoSolver is an academic CS team project focused on learning and applying key concepts in software engineering and computer science, including:
- Algorithms (Haversine, Path Interpolation)
- Object-oriented and software engineering principles
- Real-time systems and synchronization
- Backend API development
- Frontend state management and interactive visualization
- Simulation and logistics optimization

---

## 👥 Team

1. **Muhammad Zulqarnain Abdullah**
   - Student ID: 24-CS-19
   - Role: Lead Architect & Developer
2. **陈步青**
   - University: 郑州轻工业大学
   - Role: Team Member
3. **李翘辰**
   - University: 哈尔滨工业大学（威海）
   - Role: Team Member

---

## 📜 License

This project is licensed under the MIT License.