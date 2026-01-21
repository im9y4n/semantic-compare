from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.api import deps
from app.schemas.config import ConfigImport
from app.db.models import Document

router = APIRouter()

@router.post("/import")
async def import_config(
    config: ConfigImport,
    session: AsyncSession = Depends(deps.get_session)
):
    """
    Import or update document configurations.
    """
    imported_count = 0
    updated_count = 0
    
    for doc_config in config.documents:
        # Check if exists
        stmt = select(Document).where(
            Document.url == str(doc_config.url),
            Document.application_name == doc_config.application_name
        )
        result = await session.execute(stmt)
        existing_doc = result.scalar_one_or_none()
        
        if existing_doc:
            existing_doc.name = doc_config.document_name
            existing_doc.schedule = doc_config.schedule
            updated_count += 1
        else:
            new_doc = Document(
                application_name=doc_config.application_name,
                name=doc_config.document_name,
                url=str(doc_config.url),
                schedule=doc_config.schedule
            )
            session.add(new_doc)
            imported_count += 1
            
    await session.commit()
    
    return {
        "message": "Configuration imported successfully",
        "imported": imported_count,
        "updated": updated_count
    }
