"""Calculation schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CalculationStatus(str, Enum):
    """Calculation status enum."""
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class CalculationCreate(BaseModel):
    """Create new calculation."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    configuration_id: Optional[str] = None
    input_params: dict = Field(..., description="Calculation parameters (Optimalizace, Baterie, FVE, Ceny, Pmax)")
    file_ids: Optional[List[str]] = Field(default=None, description="List of file UUIDs to use")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Optimalizace FVE + Baterie 2024",
                "description": "Test optimalizace s novou baterií",
                "input_params": {
                    "Optimalizace": {
                        "optimizationtype": 0,
                        "optimization_mode": "cost"
                    },
                    "Baterie": {
                        "b_cap": 3000,
                        "b_effcharge": 0.98,
                        "b_effdischarge": 0.98,
                        "b_maxpower": 1500
                    },
                    "FVE": {
                        "pv_powernom": 7000,
                        "pv_eff": 0.95
                    },
                    "Ceny": {
                        "pricefix": 2.9,
                        "pricevt": 2.5,
                        "pricent": 3.2
                    },
                    "Pmax": {
                        "pmaxodber": 6000,
                        "pmaxdodavka": 5000
                    }
                },
                "file_ids": [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "660e8400-e29b-41d4-a716-446655440001"
                ]
            }
        }


class CalculationResponse(BaseModel):
    """Calculation response."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: str
    input_params: dict
    file_ids: Optional[List[str]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440000",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Optimalizace FVE + Baterie 2024",
                "description": "Test optimalizace s novou baterií",
                "status": "completed",
                "input_params": {},
                "file_ids": ["660e8400-e29b-41d4-a716-446655440001"],
                "created_at": "2024-01-15T10:30:00",
                "started_at": "2024-01-15T10:30:05",
                "completed_at": "2024-01-15T10:32:15"
            }
        }


class CalculationResultResponse(BaseModel):
    """Calculation results with complete data."""
    id: str
    name: str
    status: str
    results: Optional[dict] = Field(None, description="Complete calculation results")
    cost_table: Optional[List[dict]] = Field(None, description="Cost breakdown table")
    energy_balance: Optional[List[dict]] = Field(None, description="Energy balance data")
    financial_balance: Optional[List[dict]] = Field(None, description="Financial balance data")
    charts_data: Optional[dict] = Field(None, description="Data for frontend charts")
    # Year-mode results (statisticky za rok - 365 dni)
    cost_table_year: Optional[List[dict]] = Field(None, description="Cost breakdown table (year mode)")
    energy_balance_year: Optional[List[dict]] = Field(None, description="Energy balance (year mode)")
    financial_balance_year: Optional[List[dict]] = Field(None, description="Financial balance (year mode)")
    battery_cycles_year: Optional[float] = Field(None, description="Battery cycles (year mode)")
    # Input metadata and parameters
    input_metadata: Optional[dict] = Field(None, description="Input files metadata")
    input_params: Optional[dict] = Field(None, description="Calculation input parameters")
    execution_time_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440000",
                "name": "Optimalizace FVE + Baterie 2024",
                "status": "completed",
                "results": {
                    "total_cost": 45678.90,
                    "savings": 12345.67,
                    "payback_years": 8.5
                },
                "cost_table": {},
                "energy_balance": {},
                "financial_balance": {},
                "charts_data": {
                    "hourly_consumption": [],
                    "battery_state": [],
                    "grid_flow": []
                },
                "execution_time_seconds": 125.5,
                "created_at": "2024-01-15T10:30:00",
                "completed_at": "2024-01-15T10:32:15"
            }
        }


class CalculationListResponse(BaseModel):
    """List of calculations."""
    total: int
    calculations: List[CalculationResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 5,
                "calculations": []
            }
        }


class DateFilterRequest(BaseModel):
    """Request to filter calculation by date range."""
    date_from: str = Field(..., description="Start date in YYYY-MM-DD format")
    date_to: str = Field(..., description="End date in YYYY-MM-DD format")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date_from": "2024-01-01",
                "date_to": "2024-03-31"
            }
        }
