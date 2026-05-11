# AutoSolver — AI Delivery Dispatch System

An AI-powered delivery dispatch platform that assigns orders to drivers optimally, draws live routes on a map, and tracks deliveries in real time.

---

## Project Structure

autosolver-dispatch/
├── frontend/     ← React + TypeScript + Vite + Tailwind + Leaflet
├── backend/      ← FastAPI + SQLite + Python
└── docs/         ← API keys, fake data, documentation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind, Leaflet |
| Backend | FastAPI, Python, SQLite, SQLAlchemy |
| Maps | Leaflet.js + OpenStreetMap |
| HTTP | Axios |

---

## Getting Started

### Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy python-multipart
uvicorn main:app --reload

Backend runs at: http://localhost:8000

### Frontend
cd frontend
npm install
npm run dev

Frontend runs at: http://localhost:5173

---

## Current Progress
- [x] Project structure setup
- [x] FastAPI backend running with fake driver data
- [x] React frontend with Leaflet map
- [x] Drivers showing as markers on map
- [x] Frontend fetching from backend successfully
- [ ] Database models (SQLite)
- [ ] Order creation endpoint
- [ ] Driver assignment algorithm
- [ ] Route drawing
- [ ] Real time updates
- [ ] Analytics dashboard
- [ ] Simulation mode

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /drivers | Get all drivers |
| GET | /orders | Get all orders |
| POST | /orders | Create new order |

---

## Team
- Frontend: Zulqarnain (Mzaq1559)
- Backend: Teammate 2
- Research/Docs: Teammate 3