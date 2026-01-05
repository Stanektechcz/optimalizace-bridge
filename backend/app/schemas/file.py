"""File upload schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class FileUploadResponse(BaseModel):
    """Response after file upload."""
    id: str
    file_type: str
    original_filename: str
    stored_filename: str
    file_size: int
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    rows_count: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "file_type": "consumption",
                "original_filename": "spotreba_2024.csv",
                "stored_filename": "550e8400_spotreba_2024.csv",
                "file_size": 524288,
                "date_from": "2024-01-01",
                "date_to": "2024-12-31",
                "rows_count": 8760,
                "created_at": "2024-01-15T10:30:00"
            }
        }


class FileResponse(BaseModel):
    """Complete file information."""
    id: str
    file_type: str
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    rows_count: Optional[int] = None
    file_metadata: Optional[dict] = None
    checksum: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    """List of files."""
    total: int
    files: list[FileResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 3,
                "files": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "file_type": "consumption",
                        "original_filename": "spotreba_2024.csv",
                        "file_size": 524288,
                        "created_at": "2024-01-15T10:30:00"
                    }
                ]
            }
        }


class FileTypeEnum(BaseModel):
    """Available file types."""
    consumption: str = "consumption"
    weather: str = "weather"
    price: str = "price"
