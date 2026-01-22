import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.session import Base

class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_name: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    url: Mapped[str] = mapped_column(String)
    schedule: Mapped[Optional[str]] = mapped_column(String, default="weekly")
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSONB, default=[])
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    versions: Mapped[List["Version"]] = relationship("Version", back_populates="document", cascade="all, delete-orphan")

class Version(Base):
    __tablename__ = "versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    content_hash: Mapped[str] = mapped_column(String)
    gcs_path: Mapped[str] = mapped_column(String)
    
    # Analysis results
    semantic_score: Mapped[Optional[float]] = mapped_column(Float)
    extracted_text_path: Mapped[Optional[str]] = mapped_column(String)
    embeddings_path: Mapped[Optional[str]] = mapped_column(String)
    
    document: Mapped["Document"] = relationship("Document", back_populates="versions")
    execution_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("executions.id"))
    execution: Mapped["Execution"] = relationship("Execution", back_populates="versions")

class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[ExecutionStatus] = mapped_column(Enum(ExecutionStatus), default=ExecutionStatus.PENDING)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    logs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steps: Mapped[Optional[List[dict]]] = mapped_column(JSONB, default=[])
    
    versions: Mapped[List["Version"]] = relationship("Version", back_populates="execution")

    @property
    def targets(self) -> List[dict]:
        seen = set()
        targets = []
        for v in self.versions:
            if v.document and v.document_id not in seen:
                seen.add(v.document_id)
                targets.append({
                    "id": v.document.id,
                    "application_name": v.document.application_name,
                    "document_name": v.document.name,
                    "url": v.document.url
                })
        return targets
