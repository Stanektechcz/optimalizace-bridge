"""Authentication schemas."""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: Optional[Dict[str, Any]] = None  # User data
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": "uuid",
                    "username": "admin",
                    "email": "admin@example.com",
                    "role": "admin"
                }
            }
        }


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None


class RefreshToken(BaseModel):
    """Refresh token request."""
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class PasswordReset(BaseModel):
    """Password reset request."""
    email: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@electree.cz"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation."""
    token: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "reset-token-here",
                "new_password": "NewSecurePass123!"
            }
        }
