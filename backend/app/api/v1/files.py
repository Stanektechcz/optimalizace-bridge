"""File upload and management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import hashlib
import uuid
from datetime import datetime, date
import pandas as pd

from app.database import get_db
from app.schemas.file import FileUploadResponse, FileListResponse, FileResponse
from app.api.v1.users import get_current_active_user
from app.models.user import User
from app.models.file import File
from app.core.config import settings

router = APIRouter()


def calculate_file_hash(file_content: bytes) -> str:
    """Calculate SHA-256 hash of file content."""
    return hashlib.sha256(file_content).hexdigest()


def parse_csv_metadata(file_path: str) -> tuple[dict, datetime.date, datetime.date]:
    """Parse CSV file and extract metadata including date range."""
    try:
        df = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip')
        
        metadata = {
            "columns": list(df.columns),
            "row_count": len(df),
            "shape": df.shape,
        }
        
        date_from = None
        date_to = None
        
        # Try to detect and parse date columns
        date_columns = []
        for col in df.columns:
            if 'date' in col.lower() or 'datum' in col.lower() or 'time' in col.lower() or 'timestamp' in col.lower():
                date_columns.append(col)
                try:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    # Remove NaT values
                    valid_dates = df[col].dropna()
                    if len(valid_dates) > 0:
                        col_min = valid_dates.min()
                        col_max = valid_dates.max()
                        metadata[f"{col}_min"] = str(col_min)
                        metadata[f"{col}_max"] = str(col_max)
                        
                        # Set overall date range
                        if date_from is None or col_min < pd.Timestamp(date_from):
                            date_from = col_min.date()
                        if date_to is None or col_max > pd.Timestamp(date_to):
                            date_to = col_max.date()
                except Exception as e:
                    print(f"Error parsing date column {col}: {e}")
        
        return metadata, date_from, date_to
    except Exception as e:
        return {"error": str(e)}, None, None


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    file_type: str = Query(..., description="File type: consumption, weather, or price"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file (CSV, XLS, XLSX).
    
    - **file**: File to upload
    - **file_type**: Type of file (consumption, weather, price)
    """
    # Validate file type
    if file_type not in ["consumption", "weather", "price"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file_type. Must be: consumption, weather, or price"
        )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f} MB"
        )
    
    # Calculate checksum
    checksum = calculate_file_hash(file_content)
    
    # Check for duplicate
    existing_file = db.query(File).filter(
        File.user_id == current_user.id,
        File.checksum == checksum
    ).first()
    
    if existing_file:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This file has already been uploaded"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1].lower()
    stored_filename = f"{file_id}{file_ext}"  # Only use UUID + extension for uniqueness
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Parse metadata for CSV/Excel files
    file_metadata = {}
    date_from = None
    date_to = None
    rows_count = None
    
    if file_ext in [".csv", ".xlsx", ".xls"]:
        if file_ext == ".csv":
            file_metadata, date_from, date_to = parse_csv_metadata(file_path)
            rows_count = file_metadata.get("row_count")
        else:
            # For Excel files, try to read and get row count
            try:
                df = pd.read_excel(file_path)
                rows_count = len(df)
                file_metadata = {"row_count": rows_count, "columns": list(df.columns)}
                
                # Try to detect date columns in Excel too
                for col in df.columns:
                    if 'date' in col.lower() or 'datum' in col.lower() or 'time' in col.lower():
                        try:
                            df[col] = pd.to_datetime(df[col], errors='coerce')
                            valid_dates = df[col].dropna()
                            if len(valid_dates) > 0:
                                col_min = valid_dates.min()
                                col_max = valid_dates.max()
                                if date_from is None or col_min < pd.Timestamp(date_from):
                                    date_from = col_min.date()
                                if date_to is None or col_max > pd.Timestamp(date_to):
                                    date_to = col_max.date()
                        except:
                            pass
            except Exception as e:
                print(f"Error parsing Excel file: {e}")
    
    # Create database record
    db_file = File(
        id=file_id,
        user_id=current_user.id,
        file_type=file_type,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        date_from=date_from,
        date_to=date_to,
        rows_count=rows_count,
        file_metadata=file_metadata if file_metadata else None,
        checksum=checksum
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file


@router.get("/", response_model=FileListResponse)
def list_files(
    file_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List user's uploaded files.
    
    - **file_type**: Optional filter by file type
    - **skip**: Pagination offset
    - **limit**: Maximum results
    """
    query = db.query(File).filter(File.user_id == current_user.id)
    
    if file_type:
        query = query.filter(File.file_type == file_type)
    
    total = query.count()
    files = query.order_by(File.created_at.desc()).offset(skip).limit(limit).all()
    
    return FileListResponse(total=total, files=files)


@router.get("/{file_id}", response_model=FileResponse)
def get_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get file details by ID."""
    file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete file."""
    file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file
    try:
        if os.path.exists(file.file_path):
            os.remove(file.file_path)
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Error deleting file: {e}")
    
    # Delete database record
    db.delete(file)
    db.commit()
    
    return None
