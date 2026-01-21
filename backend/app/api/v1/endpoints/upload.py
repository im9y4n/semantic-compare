from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.services.storage import StorageService
from app.db.models import Document
from datetime import datetime

router = APIRouter()

@router.post("/upload", response_model=Any)
async def upload_document(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(deps.get_session)
):
    """
    Upload a file to internal storage and return its internal URL.
    """
    try:
        storage = StorageService()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        path = f"uploads/{filename}"
        
        content = await file.read()
        await storage.upload(path, content, file.content_type or "application/octet-stream")
        
        internal_url = f"internal://{path}"
        return {"url": internal_url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
