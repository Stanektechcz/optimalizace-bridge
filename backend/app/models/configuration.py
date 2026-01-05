from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, BigInteger, Date, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from app.database import Base


class Configuration(Base):
    """User configuration/settings model."""
    
    __tablename__ = "configurations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # All INI settings as JSON
    config_data = Column(JSON, nullable=False)
    
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="configurations")
    
    def __repr__(self):
        return f"<Configuration {self.name}>"
