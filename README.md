# AutoSolver — AI Delivery Dispatch System

**AutoSolver** is a high-performance, real-time logistics platform designed for automated driver assignment, dynamic traffic simulation, and delivery tracking. Built as a CS team project by **Muhammad Zulqarnain Abdullah (24-CS-19)**, it focuses on solving the "manual dispatching bottleneck" using an algorithm-driven simulation engine.

---

## 🚀 Project Overview

The system replicates a complex delivery ecosystem within the city of Lahore (default coordinates). It manages the full lifecycle of an order—from scheduling and assignment to real-time transit and final delivery. 

### Key Capabilities
- **Time-Warped Simulation**: Replicates 1 hour of delivery operations in ~5 minutes using a configurable speed multiplier (default 12x).
- **Intelligent Dispatching**: Automatically matches pending orders with the nearest available drivers using a Haversine-based scoring algorithm.
- **Real-Time Visualization**: A dynamic map interface showing pulsing driver markers, target destinations, and active routes.
- **Dynamic Traffic Effects**: Injects stochastic traffic events that realistically slow down driver speeds and update ETAs.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: React Hooks & Context API
- **Maps**: Leaflet & React-Leaflet (with Marker Clustering)
- **Visuals**: Framer Motion (Animations) & Recharts (Analytics)
- **Networking**: Axios & Socket.io-client
- **Performance**: React Window (List Virtualization)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Real-time**: Python-SocketIO & Standard WebSockets
- **Engine**: Custom Asynchronous Simulation Engine

---

## 🏗️ Architecture & Workflow

### 1. Simulation Engine (`simulation_engine.py`)
The "brain" of the system. It runs a non-blocking loop that:
- Spawns orders based on a predefined schedule.
- Calculates driver movement using coordinate interpolation.
- Applies a 15% probability of traffic delays to active drivers.
- Computes real-time statistics (Orders per minute, Avg. delivery time).

### 2. API Layer (`main.py`)
A RESTful interface built with FastAPI that handles:
- **Authentication**: Role-based access for Owners, Drivers, and Customers.
- **Data Management**: CRUD operations for drivers, restaurants, and orders.
- **Simulation Control**: Endpoints to start, pause, resume, and adjust speed.

### 3. Real-Time Broadcasting
The backend utilizes **Socket.IO** to push compressed state updates (delta updates) to the frontend every 2 seconds, ensuring the UI stays perfectly synced with the simulation engine.

---

## 📊 Current Progress

### ✅ Completed & Fully Functional
- [x] **Database Schema**: Robust SQLite implementation with SQLAlchemy models.
- [x] **Simulation Engine**: Full lifecycle management with traffic and movement.
- [x] **Automated Assignment**: Nearest-neighbor algorithm with capacity management.
- [x] **Real-time Dashboards**: Live Map, Analytics Charts, and Control Panels.
- [x] **Auth System**: Working registration and login for multiple user roles.
- [x] **Route Visualization**: Dynamic Polyline drawing between drivers and targets.

### 🏗️ Planned (Roadmap)
- [ ] **Advanced Routing**: Integration with OSRM/Google Maps for street-level pathfinding (currently uses straight-line interpolation).
- [ ] **Predictive AI**: Anticipating high-demand zones using historical data.
- [ ] **Mobile App**: Dedicated React Native interface for drivers.
- [ ] **Multi-Region Support**: Simulating multiple cities simultaneously.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user (Owner, Driver, Customer) |
| `POST` | `/auth/login` | Authenticate and receive user session |
| `GET` | `/simulation/status` | Get current simulation state (running/paused/time) |
| `POST` | `/simulation/start` | Launch the simulation engine |
| `POST` | `/simulation/pause` | Pause the active simulation |
| `GET` | `/drivers` | List all registered drivers and their status |
| `POST` | `/orders` | Create a new delivery order |
| `POST` | `/assignments/run` | Manually trigger the assignment algorithm |

---

## ⚙️ Installation & Run Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 👥 Team
- **Muhammad Zulqarnain Abdullah** (24-CS-19) - *Lead Architect & Developer*

## 📜 License
This project is for academic purposes under the AutoSolver team. MIT License.