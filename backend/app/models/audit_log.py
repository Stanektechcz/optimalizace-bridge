from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, BigInteger, Date, JSON
from sqlalchemy.sql import func
from sqlalchemy import ForeignKey
import uuid
from app.database import Base


class AuditLog(Base):
    """Audit log model for tracking user actions."""
    
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    
    action = Column(String(100), nullable=False, index=True)  # login, create_calculation, delete_file, etc.
    resource_type = Column(String(50))
    resource_id = Column(String(36))
    
    details = Column(JSON)
    
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<AuditLog {self.action}>"
