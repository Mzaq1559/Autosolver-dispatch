from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fake data for now
drivers = [
    {"id": 1, "name": "Ali", "lat": 31.5204, "lng": 74.3587, "status": "available"},
    {"id": 2, "name": "Usman", "lat": 31.5304, "lng": 74.3687, "status": "available"},
    {"id": 3, "name": "Bilal", "lat": 31.5104, "lng": 74.3487, "status": "available"},
]

orders = []

@app.get("/")
def root():
    return {"message": "AutoSolver API is running"}

@app.get("/drivers")
def get_drivers():
    return drivers

@app.get("/orders")
def get_orders():
    return orders