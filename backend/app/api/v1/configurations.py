"""Configuration management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.configuration import (
    ConfigurationCreate,
    ConfigurationUpdate,
    ConfigurationResponse,
    ConfigurationListResponse
)
from app.api.v1.users import get_current_active_user
from app.models.user import User
from app.models.configuration import Configuration

router = APIRouter()


@router.post("/", response_model=ConfigurationResponse, status_code=status.HTTP_201_CREATED)
def create_configuration(
    config_data: ConfigurationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create new configuration.
    
    - **name**: Configuration name
    - **config_data**: JSON configuration data
    - **is_default**: Set as default configuration (will unset other defaults)
    """
    # If setting as default, unset other defaults
    if config_data.is_default:
        db.query(Configuration).filter(
            Configuration.user_id == current_user.id,
            Configuration.is_default == True
        ).update({"is_default": False})
        db.commit()
    
    # Create configuration
    configuration = Configuration(
        user_id=current_user.id,
        name=config_data.name,
        description=config_data.description,
        config_data=config_data.config_data,
        is_default=config_data.is_default
    )
    
    db.add(configuration)
    db.commit()
    db.refresh(configuration)
    
    return configuration


@router.get("/", response_model=ConfigurationListResponse)
def list_configurations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List user's configurations.
    
    Default configuration will be listed first.
    """
    query = db.query(Configuration).filter(Configuration.user_id == current_user.id)
    
    total = query.count()
    configurations = query.order_by(
        Configuration.is_default.desc(),
        Configuration.updated_at.desc()
    ).offset(skip).limit(limit).all()
    
    return ConfigurationListResponse(total=total, configurations=configurations)


@router.get("/default", response_model=ConfigurationResponse)
def get_default_configuration(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's default configuration."""
    configuration = db.query(Configuration).filter(
        Configuration.user_id == current_user.id,
        Configuration.is_default == True
    ).first()
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default configuration found"
        )
    
    return configuration


@router.get("/{config_id}", response_model=ConfigurationResponse)
def get_configuration(
    config_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get configuration by ID."""
    configuration = db.query(Configuration).filter(
        Configuration.id == config_id,
        Configuration.user_id == current_user.id
    ).first()
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    return configuration


@router.put("/{config_id}", response_model=ConfigurationResponse)
def update_configuration(
    config_id: str,
    config_update: ConfigurationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update configuration."""
    configuration = db.query(Configuration).filter(
        Configuration.id == config_id,
        Configuration.user_id == current_user.id
    ).first()
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    # If setting as default, unset other defaults
    if config_update.is_default:
        db.query(Configuration).filter(
            Configuration.user_id == current_user.id,
            Configuration.is_default == True,
            Configuration.id != config_id
        ).update({"is_default": False})
    
    # Update fields
    if config_update.name is not None:
        configuration.name = config_update.name
    if config_update.description is not None:
        configuration.description = config_update.description
    if config_update.config_data is not None:
        configuration.config_data = config_update.config_data
    if config_update.is_default is not None:
        configuration.is_default = config_update.is_default
    
    db.commit()
    db.refresh(configuration)
    
    return configuration


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_configuration(
    config_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete configuration."""
    configuration = db.query(Configuration).filter(
        Configuration.id == config_id,
        Configuration.user_id == current_user.id
    ).first()
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    db.delete(configuration)
    db.commit()
    
    return None
