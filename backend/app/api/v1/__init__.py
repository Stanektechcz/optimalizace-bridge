"""API v1 routers package."""

from fastapi import APIRouter
from app.api.v1 import auth, users, files, calculations, configurations

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(calculations.router, prefix="/calculations", tags=["Calculations"])
api_router.include_router(configurations.router, prefix="/configurations", tags=["Configurations"])
