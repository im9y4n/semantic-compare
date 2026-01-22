from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class DocumentConfig(BaseModel):
    application_name: str
    document_name: str
    url: str # Allow internal:// scheme
    keywords: Optional[List[str]] = []
    schedule: Optional[str] = "weekly"

class ConfigImport(BaseModel):
    documents: List[DocumentConfig]

class DocumentResponse(BaseModel):
    id: Optional[UUID] = None
    application_name: str
    name: str # map 'document_name' or just 'name' from DB
    url: str
    keywords: Optional[List[str]] = []
    schedule: Optional[str]
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True

class VersionSchema(BaseModel):
    id: UUID
    document_id: UUID
    timestamp: datetime
    content_hash: str
    gcs_path: str
    semantic_score: Optional[float] = None
    extracted_text_path: Optional[str] = None
    embeddings_path: Optional[str] = None
    execution_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class ExecutionSchema(BaseModel):
    id: UUID
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    logs: Optional[str] = None
    steps: Optional[List[dict]] = []

    class Config:
        from_attributes = True
