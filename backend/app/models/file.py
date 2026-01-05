from sqlalchemy import Column, String, Integer, BigInteger, Date, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from app.database import Base


class File(Base):
    """Uploaded file model (CSV consumption, weather, price data)."""
    
    __tablename__ = "files"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    file_type = Column(String(50), nullable=False, index=True)  # consumption, weather, price
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # Removed unique constraint
    file_path = Column(Text, unique=True, nullable=False)  # file_path is unique instead
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    
    # Data range
    date_from = Column(Date)
    date_to = Column(Date)
    rows_count = Column(Integer)
    
    # File metadata (parsed info from file) - renamed to avoid SQLAlchemy reserved word
    file_metadata = Column(JSON)
    
    # Checksum for deduplication
    checksum = Column(String(64))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="files")
    
    def __repr__(self):
        return f"<File {self.original_filename}>"
