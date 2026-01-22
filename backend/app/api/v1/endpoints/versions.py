from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models import Version, Document
from app.api.deps import get_session as get_db
import uuid
import json
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

@router.get("/{id}/matches")
async def get_version_matches(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_db)
):
    """
    Get keyword matches for a specific version.
    """
    version = await session.get(Version, id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    doc = await session.get(Document, version.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not doc.keywords:
         return {"matches": [], "keywords": []}

    if not version.extracted_text_path:
         raise HTTPException(status_code=400, detail="No extracted text available for this version")

    try:
        content = await storage_service.download(version.extracted_text_path)
        if not content:
             raise HTTPException(status_code=404, detail="Extracted text file missing")
             
        segments = json.loads(content)
        
        matches = []
        for seg in segments:
            text_lower = seg["normalized_text"].lower()
            for kw in doc.keywords:
                if kw.lower() in text_lower:
                    matches.append({
                        "page": seg["page"],
                        "keyword": kw,
                        "text": seg["text"][:300] + "..." if len(seg["text"]) > 300 else seg["text"]
                    })
        
        return {"matches": matches, "keywords": doc.keywords}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
