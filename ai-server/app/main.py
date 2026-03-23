import os
from dotenv import load_dotenv

load_dotenv()  # Load .env variables first
print("GOOGLE_APPLICATION_CREDENTIALS =", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.routes import cleanup_routes, ai_routes  
from app.db.mongo import connect_db, close_db

app = FastAPI(
    title="ShoreClean AI Server",
    version="1.0.0",
    description="AI-powered cleanup management and flyer generation service"
)

# Explicit origins + regex so any localhost / 127.0.0.1 dev port works
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes (cleanup_routes already has prefix="/cleanup" defined in the router)
app.include_router(cleanup_routes.router)
app.include_router(ai_routes.router, prefix="/ai", tags=["AI"])

# MongoDB connection events
@app.on_event("startup")
async def startup_db_client():
    await connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()
