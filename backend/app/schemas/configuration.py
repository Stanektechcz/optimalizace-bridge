"""Configuration schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ConfigurationCreate(BaseModel):
    """Create new configuration."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    config_data: dict = Field(..., description="Configuration JSON data")
    is_default: bool = Field(default=False, description="Set as default configuration")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Můj dům - FVE 7kW",
                "description": "Konfigurace pro rodinný dům s FVE 7kW a baterií 3kWh",
                "is_default": True,
                "config_data": {
                    "Optimalizace": {
                        "optimizationtype": 0
                    },
                    "Baterie": {
                        "b_cap": 3000,
                        "b_effcharge": 0.98,
                        "b_effdischarge": 0.98
                    },
                    "FVE": {
                        "pv_powernom": 7000,
                        "pv_eff": 0.95
                    },
                    "Ceny": {
                        "pricefix": 2.9
                    },
                    "Pmax": {
                        "pmaxodber": 6000
                    }
                }
            }
        }


class ConfigurationUpdate(BaseModel):
    """Update existing configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config_data: Optional[dict] = None
    is_default: Optional[bool] = None


class ConfigurationResponse(BaseModel):
    """Configuration response."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    config_data: dict
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "880e8400-e29b-41d4-a716-446655440000",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Můj dům - FVE 7kW",
                "description": "Konfigurace pro rodinný dům",
                "config_data": {},
                "is_default": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }


class ConfigurationListResponse(BaseModel):
    """List of configurations."""
    total: int
    configurations: list[ConfigurationResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 3,
                "configurations": []
            }
        }
