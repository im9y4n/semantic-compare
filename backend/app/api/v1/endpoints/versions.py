from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models import Version
from app.services.storage import StorageService

router = APIRouter()
storage_service = StorageService()

@router.get("/{id}/content", response_model=Any)
async def get_version_content(
    id: str,
    session: AsyncSession = Depends(deps.get_session)
):
    """
    Retrieve the textual content of a specific version.
    """
    stmt = select(Version).where(Version.id == id)
    result = await session.execute(stmt)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    if not version.extracted_text_path:
        raise HTTPException(status_code=404, detail="No extracted text available for this version")
        
    try:
        content_bytes = await storage_service.download(version.extracted_text_path)
        return {"content": content_bytes.decode("utf-8")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve content: {str(e)}")
