# AutoSolver — AI Delivery Dispatch System

An AI-powered delivery dispatch platform that assigns orders to drivers optimally, draws live routes on a map, and tracks deliveries in real time.

---

## Project Overview

AutoSolver is a full-stack dispatch system with dedicated dashboards for Owners, Drivers, and Customers. It handles order creation, algorithm-based driver assignments, and live map visualization.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Framer Motion |
| **Backend** | FastAPI, Python, SQLite, SQLAlchemy |
| **Maps & Routing** | Leaflet.js (`react-leaflet`) |
| **HTTP Client** | Axios |

---

## Architecture

The project consists of two main applications communicating over REST APIs:

- **Frontend (`/frontend`)**: A React SPA providing role-based dashboards:
  - **Owner Dashboard**: Views overall analytics, map of all drivers, and manages pending assignments.
  - **Driver Dashboard**: Receives assigned orders, updates status (Accepted, Picked Up, Delivering), and sees routes to customers.
  - **Customer Dashboard**: Tracks personal order status and views live driver tracking on the map.
- **Backend (`/backend`)**: A FastAPI service connected to a SQLite database. Handles role entities (Drivers, Orders, Assignments), order state machines, and runs the dispatch matching algorithm.

---

## Current Progress

- [x] Project structure setup
- [x] FastAPI backend running with SQLite database & seed data
- [x] Database models (Drivers, Orders, Assignments)
- [x] React frontend with Leaflet map
- [x] Drivers showing as markers on map
- [x] Frontend fetching from backend successfully
- [x] Order creation endpoint
- [x] Driver assignment algorithm (baseline `haversine` distance optimizer implemented)
- [x] Route drawing (via map polylines on dashboards)
- [x] Real-time updates (via frontend polling)
- [x] Analytics dashboard (Owner dashboard panels)
- [ ] Backend Authentication logic
- [ ] Simulation mode

---

## API Endpoints

### Core
- `GET /` - Root health check
- `GET /health` - API status monitoring

### Drivers
- `GET /drivers` - Retrieve all drivers
- `POST /drivers` - Create a new driver

### Orders
- `GET /orders` - Retrieve all orders
- `POST /orders` - Create a new order
- `GET /orders/{order_id}` - Retrieve a specific order by ID

### Assignments
- `POST /assignments/run` - Trigger the assignment algorithm to dispatch pending orders to available drivers
- `GET /assignments` - Retrieve all assignment history

---

## How to Run

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*Backend runs at: http://localhost:8000*

### Frontend

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: http://localhost:5173*

---

## Roadmap

- [ ] Full backend Authentication integration (Frontend `AuthContext` is currently mocked)
- [ ] Simulation mode (Simulate heavy load and driver movement)
- [ ] Advanced map routing API integration (e.g., OSRM) for real street distances
- [ ] WebSockets for truly real-time bi-directional updates instead of polling

---

## Team
- Frontend: Zulqarnain (Mzaq1559)
- Backend: Teammate 2
- Research/Docs: Teammate 3