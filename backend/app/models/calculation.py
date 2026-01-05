from sqlalchemy import Column, String, Integer, DateTime, Text, Numeric
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, BigInteger, Date, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from app.database import Base


class Calculation(Base):
    """Calculation model for energy optimization results."""
    
    __tablename__ = "calculations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    config_id = Column(String(36), ForeignKey("configurations.id", ondelete="SET NULL"))
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, running, completed, failed
    progress = Column(Integer, default=0, nullable=False)  # 0-100
    
    # Input parameters
    input_params = Column(JSON, nullable=False)
    file_ids = Column(JSON)  # Array of file UUIDs
    
    # Execution info
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    execution_time_seconds = Column(Integer)
    error_message = Column(Text)
    
    # Results
    results = Column(JSON)  # Complete calculation results
    cost_table = Column(JSON)
    energy_balance = Column(JSON)
    financial_balance = Column(JSON)
    battery_cycles = Column(Numeric(10, 2))
    charts_data = Column(JSON)  # Data for frontend charts
    
    # Year-mode results (statisticky za rok - 365 dni)
    cost_table_year = Column(JSON)
    energy_balance_year = Column(JSON)
    financial_balance_year = Column(JSON)
    battery_cycles_year = Column(Numeric(10, 2))
    
    # Input metadata
    input_metadata = Column(JSON)  # Metadata about input files
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="calculations")
    configuration = relationship("Configuration")
    logs = relationship("CalculationLog", back_populates="calculation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Calculation {self.name} - {self.status}>"


class CalculationLog(Base):
    """Logs for calculation execution (console output)."""
    
    __tablename__ = "calculation_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    calculation_id = Column(String(36), ForeignKey("calculations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    log_level = Column(String(20), default="info")  # info, warning, error
    message = Column(Text, nullable=False)
    
    # Relationships
    calculation = relationship("Calculation", back_populates="logs")
    
    def __repr__(self):
        return f"<Log {self.log_level}: {self.message[:50]}>"
