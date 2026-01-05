from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, BigInteger, Date, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from app.database import Base


class APIKey(Base):
    """API Key model for external API access."""
    
    __tablename__ = "api_keys"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    key_hash = Column(String(255), unique=True, nullable=False)
    name = Column(String(100))
    
    permissions = Column(JSON)  # ["read", "write", "execute"]
    rate_limit = Column(Integer, default=100, nullable=False)  # requests per hour
    
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_used_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    def __repr__(self):
        return f"<APIKey {self.name}>"
