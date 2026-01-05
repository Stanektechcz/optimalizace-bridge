"""Calculation endpoints - create, run, get results."""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.schemas.calculation import (
    CalculationCreate,
    CalculationResponse,
    CalculationListResponse,
    CalculationResultResponse,
    CalculationStatus,
    DateFilterRequest
)
from app.api.v1.users import get_current_active_user
from app.models.user import User
from app.models.calculation import Calculation, CalculationLog
from app.models.file import File
from app.services.calculation_engine import calculation_engine

router = APIRouter()


def run_calculation_task(
    calculation_id: str,
    input_params: dict,
    user_id: str
):
    """Background task to run calculation."""
    # Create new database session for background task
    from app.database import SessionLocal
    db_session = SessionLocal()
    
    try:
        calculation = db_session.query(Calculation).filter(Calculation.id == calculation_id).first()
        
        if not calculation:
            db_session.close()
            return
        
        # Update status to running
        calculation.status = CalculationStatus.running.value
        calculation.started_at = datetime.utcnow()
        db_session.commit()
        
        # Log start
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message="Calculation started",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Log validation start
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message="Validating configuration...",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Validate configuration
        is_valid, error_msg = calculation_engine.validate_config(input_params)
        if not is_valid:
            raise ValueError(f"Invalid configuration: {error_msg}")
        
        # Log calculation start
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message="Configuration valid. Starting calculation...",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Prepare input files before calculation
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message="Preparing input files...",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        from app.models.file import File
        from pathlib import Path
        import shutil
        
        # Get root directory (parent of backend/)
        root_dir = Path(__file__).parent.parent.parent.parent.parent
        data_input_dir = root_dir / "data_input"
        data_ready_dir = root_dir / "data_ready"
        
        # Clean data_input directory
        if data_input_dir.exists():
            for file in data_input_dir.glob("*.xlsx"):
                file.unlink()
            for file in data_input_dir.glob("*.csv"):
                file.unlink()
        else:
            data_input_dir.mkdir(parents=True, exist_ok=True)
        
        # Ensure data_ready exists
        data_ready_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy files from database to data_input
        file_names = []
        earliest_date = None
        latest_date = None
        total_hours = 0
        
        for file_id in calculation.file_ids:
            file_obj = db_session.query(File).filter(File.id == file_id).first()
            if not file_obj:
                raise ValueError(f"File {file_id} not found in database")
            
            # Copy file to data_input
            source_path = Path(file_obj.file_path)
            if not source_path.exists():
                raise ValueError(f"File not found on disk: {source_path}")
            
            dest_path = data_input_dir / file_obj.original_filename
            shutil.copy2(source_path, dest_path)
            
            file_names.append(file_obj.original_filename)
            
            # Track date range
            if file_obj.file_metadata:
                file_date_from = file_obj.file_metadata.get('date_from')
                file_date_to = file_obj.file_metadata.get('date_to')
                file_hours = file_obj.file_metadata.get('total_hours', file_obj.rows_count)
                
                if file_date_from:
                    if earliest_date is None or file_date_from < earliest_date:
                        earliest_date = file_date_from
                if file_date_to:
                    if latest_date is None or file_date_to > latest_date:
                        latest_date = file_date_to
                if file_hours:
                    total_hours += file_hours
        
        # Create info_files.txt
        info_files_path = data_ready_dir / "info_files.txt"
        with open(info_files_path, 'w', encoding='utf8') as f:
            if earliest_date and latest_date:
                f.write(f"{earliest_date};{latest_date};{total_hours}\n")
            else:
                f.write(";;0\n")
            for fname in file_names:
                f.write(f"{fname}\n")
        
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message=f"Prepared {len(file_names)} input file(s): {', '.join(file_names)}",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Run calculation using Bridge
        start_time = datetime.utcnow()
        results = calculation_engine.calculate(input_params)
        end_time = datetime.utcnow()
        
        execution_time = (end_time - start_time).total_seconds()
        
        # Log calculation completed
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message=f"Calculation engine completed in {execution_time:.2f}s",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Update calculation with results
        calculation.status = CalculationStatus.completed.value
        calculation.completed_at = datetime.utcnow()
        calculation.execution_time_seconds = execution_time
        
        # Log storing results
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message="Storing results to database...",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
        # Store results - ensure we're using the actual data, not empty defaults
        calculation.results = results.get("results") if results.get("results") else None
        calculation.cost_table = results.get("cost_table") if results.get("cost_table") else None
        calculation.energy_balance = results.get("energy_balance") if results.get("energy_balance") else None
        calculation.financial_balance = results.get("financial_balance") if results.get("financial_balance") else None
        calculation.charts_data = results.get("charts_data") if results.get("charts_data") else None
        
        # Store year-mode results (statisticky za rok - 365 dni)
        calculation.cost_table_year = results.get("cost_table_year") if results.get("cost_table_year") else None
        calculation.energy_balance_year = results.get("energy_balance_year") if results.get("energy_balance_year") else None
        calculation.financial_balance_year = results.get("financial_balance_year") if results.get("financial_balance_year") else None
        # battCyclesYear is inside results["results"], not at top level
        calculation.battery_cycles_year = results.get("results", {}).get("battCyclesYear") if results.get("results") else None
        
        # Store input metadata
        calculation.input_metadata = results.get("input_metadata") if results.get("input_metadata") else None
        
        # Log what we're storing
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message=f"Stored: results={bool(calculation.results)}, cost_table={bool(calculation.cost_table)}, energy_balance={bool(calculation.energy_balance)}, financial_balance={bool(calculation.financial_balance)}, charts_data={bool(calculation.charts_data)}, year_tables={bool(calculation.cost_table_year)}, metadata={bool(calculation.input_metadata)}",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        
        try:
            db_session.commit()
            log_entry = CalculationLog(
                calculation_id=calculation_id,
                log_level="INFO",
                message="Results successfully saved to database",
                timestamp=datetime.utcnow()
            )
            db_session.add(log_entry)
            db_session.commit()
        except Exception as db_error:
            log_entry = CalculationLog(
                calculation_id=calculation_id,
                log_level="ERROR",
                message=f"Database error while saving results: {str(db_error)}",
                timestamp=datetime.utcnow()
            )
            db_session.add(log_entry)
            db_session.commit()
            raise
        
        # Log completion
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="INFO",
            message=f"Calculation completed in {execution_time:.2f}s",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
    except Exception as e:
        # Update calculation with error
        calculation.status = CalculationStatus.failed.value
        calculation.completed_at = datetime.utcnow()
        calculation.error_message = str(e)
        db_session.commit()
        
        # Log error
        log_entry = CalculationLog(
            calculation_id=calculation_id,
            log_level="ERROR",
            message=f"Calculation failed: {str(e)}",
            timestamp=datetime.utcnow()
        )
        db_session.add(log_entry)
        db_session.commit()
        
    finally:
        # Always close the database session
        db_session.close()


@router.post("/", response_model=CalculationResponse, status_code=status.HTTP_201_CREATED)
def create_calculation(
    calc_data: CalculationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create and start new calculation.
    
    - **name**: Calculation name
    - **input_params**: Configuration parameters (Optimalizace, Baterie, FVE, Ceny, Pmax)
    - **file_ids**: Optional list of file IDs to use in calculation
    - **configuration_id**: Optional saved configuration ID
    
    The calculation will run asynchronously in the background.
    """
    # Validate files belong to user
    if calc_data.file_ids:
        file_count = db.query(File).filter(
            File.id.in_(calc_data.file_ids),
            File.user_id == current_user.id
        ).count()
        
        if file_count != len(calc_data.file_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more files not found or don't belong to user"
            )
    
    # Create calculation record
    # Convert empty strings to None for foreign keys
    config_id = calc_data.configuration_id if calc_data.configuration_id else None
    file_ids = calc_data.file_ids if calc_data.file_ids else None
    
    calculation = Calculation(
        user_id=current_user.id,
        name=calc_data.name,
        description=calc_data.description,
        status=CalculationStatus.pending.value,
        input_params=calc_data.input_params,
        file_ids=file_ids,
        config_id=config_id
    )
    
    db.add(calculation)
    db.commit()
    db.refresh(calculation)
    
    # Start calculation in background
    background_tasks.add_task(
        run_calculation_task,
        calculation.id,
        calc_data.input_params,
        current_user.id
    )
    
    return calculation


@router.get("/")
def list_calculations(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    lightweight: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List user's calculations.
    
    - **status**: Optional filter by status (pending, running, completed, failed)
    - **skip**: Pagination offset
    - **limit**: Maximum results
    - **lightweight**: If true, returns only basic info without large JSON fields (faster)
    """
    import time
    start_time = time.time()
    
    from sqlalchemy.orm import load_only
    from fastapi.responses import JSONResponse
    import json
    from datetime import datetime
    
    # Build base query with only needed columns for lightweight mode
    if lightweight:
        # In lightweight mode, only load specific columns - MUCH FASTER!
        query = db.query(Calculation).options(
            load_only(
                Calculation.id,
                Calculation.user_id,
                Calculation.name,
                Calculation.description,
                Calculation.status,
                Calculation.created_at,
                Calculation.started_at,
                Calculation.completed_at,
                Calculation.error_message,
                Calculation.execution_time_seconds,
                Calculation.battery_cycles,
                Calculation.battery_cycles_year,
            )
        ).filter(Calculation.user_id == current_user.id)
    else:
        query = db.query(Calculation).filter(Calculation.user_id == current_user.id)
    
    if status:
        query = query.filter(Calculation.status == status)
    
    total = query.count()
    calculations = query.order_by(Calculation.created_at.desc()).offset(skip).limit(limit).all()
    
    # For lightweight mode, manually serialize to avoid Pydantic accessing deferred fields
    if lightweight:
        def serialize_datetime(dt):
            return dt.isoformat() if dt else None
        
        calcs_data = []
        for calc in calculations:
            calcs_data.append({
                "id": calc.id,
                "user_id": calc.user_id,
                "name": calc.name,
                "description": calc.description,
                "status": calc.status,
                "input_params": {},  # Empty for lightweight
                "file_ids": [],  # Empty for lightweight
                "created_at": serialize_datetime(calc.created_at),
                "started_at": serialize_datetime(calc.started_at),
                "completed_at": serialize_datetime(calc.completed_at),
                "error_message": calc.error_message,
                "execution_time_seconds": float(calc.execution_time_seconds) if calc.execution_time_seconds else None,
                "battery_cycles": float(calc.battery_cycles) if calc.battery_cycles else None,
                "battery_cycles_year": float(calc.battery_cycles_year) if calc.battery_cycles_year else None,
            })
        
        elapsed = (time.time() - start_time) * 1000
        print(f"[PERF] list_calculations lightweight: {elapsed:.0f}ms (total={total})")
        response = JSONResponse(content={"total": total, "calculations": calcs_data})
        response.headers["X-Processing-Time-Ms"] = str(int(elapsed))
        return response
    else:
        # Use normal Pydantic serialization for full mode
        elapsed = (time.time() - start_time) * 1000
        print(f"[PERF] list_calculations full: {elapsed:.0f}ms (total={total})")
        return CalculationListResponse(total=total, calculations=calculations)


@router.get("/{calculation_id}", response_model=CalculationResultResponse)
def get_calculation(
    calculation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get calculation details and results.
    
    Returns complete calculation data including results, cost tables, and chart data.
    """
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    return calculation


@router.delete("/{calculation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calculation(
    calculation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete calculation and all related logs."""
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    # Cannot delete running calculations
    if calculation.status == CalculationStatus.running.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete running calculation"
        )
    
    db.delete(calculation)
    db.commit()
    
    return None


@router.get("/{calculation_id}/logs")
def get_calculation_logs(
    calculation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get calculation execution logs."""
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    logs = db.query(CalculationLog).filter(
        CalculationLog.calculation_id == calculation_id
    ).order_by(CalculationLog.timestamp.asc()).all()
    
    return {
        "calculation_id": calculation_id,
        "total_logs": len(logs),
        "logs": [
            {
                "timestamp": log.timestamp,
                "level": log.log_level,
                "message": log.message
            }
            for log in logs
        ]
    }


@router.post("/{calculation_id}/cancel")
def cancel_calculation(
    calculation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancel running calculation.
    
    Note: This sets the status to cancelled but cannot stop already running process.
    """
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    if calculation.status not in [CalculationStatus.pending.value, CalculationStatus.running.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel calculation with status: {calculation.status}"
        )
    
    calculation.status = CalculationStatus.cancelled.value
    calculation.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Calculation cancelled", "calculation_id": calculation_id}


@router.post("/{calculation_id}/recalculate")
def recalculate(
    calculation_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Recalculate an existing calculation with the same parameters.
    This will clear the old results and run the calculation again with updated logic.
    """
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    # Cannot recalculate running calculations
    if calculation.status == CalculationStatus.running.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot recalculate running calculation"
        )
    
    # Clear old results and reset status
    calculation.results = None
    calculation.status = CalculationStatus.pending.value
    calculation.started_at = None
    calculation.completed_at = None
    calculation.error = None
    calculation.execution_time = None
    
    # Clear old logs
    db.query(CalculationLog).filter(
        CalculationLog.calculation_id == calculation_id
    ).delete()
    
    db.commit()
    
    # Start calculation in background
    background_tasks.add_task(
        run_calculation_task,
        calculation_id,
        calculation.input_params,
        current_user.id
    )
    
    return {
        "message": "Calculation restarted",
        "calculation_id": calculation_id,
        "status": calculation.status
    }


@router.post("/{calculation_id}/filter-by-date")
def filter_calculation_by_date(
    calculation_id: str,
    filter_request: DateFilterRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Filter calculation results by custom date range.
    Returns recalculated cost, energy and financial tables for the selected period.
    
    Example request body:
    ```json
    {
        "date_from": "2024-01-01",
        "date_to": "2024-03-31"
    }
    ```
    """
    calculation = db.query(Calculation).filter(
        Calculation.id == calculation_id,
        Calculation.user_id == current_user.id
    ).first()
    
    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    if calculation.status != CalculationStatus.completed.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot filter calculation with status: {calculation.status}"
        )
    
    try:
        # Call calculation engine to filter results by date range
        filtered_results = calculation_engine.filter_by_date_range(
            calculation_id=calculation_id,
            input_params=calculation.input_params,
            date_from=filter_request.date_from,
            date_to=filter_request.date_to
        )
        
        return {
            "calculation_id": calculation_id,
            "date_from": filter_request.date_from,
            "date_to": filter_request.date_to,
            "cost_table": filtered_results.get("cost_table"),
            "energy_balance": filtered_results.get("energy_balance"),
            "financial_balance": filtered_results.get("financial_balance"),
            "results": filtered_results.get("results")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error filtering results: {str(e)}"
        )
