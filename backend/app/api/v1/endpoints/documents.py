from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.api import deps
from app.db.models import Document
from app.schemas.config import DocumentConfig, DocumentResponse

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(deps.get_session)
):
    stmt = select(Document).offset(skip).limit(limit)
    result = await session.execute(stmt)
    docs = result.scalars().all()
    # Pydantic v2 from_attributes handles ORM objects
    # Pydantic v2 from_attributes handles ORM objects
    return docs

@router.get("/{id}", response_model=DocumentResponse)
async def get_document(
    id: str,
    session: AsyncSession = Depends(deps.get_session)
):
    """
    Get a specific document by ID.
    """
    doc = await session.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/", response_model=DocumentResponse)
async def create_document(
    doc_in: DocumentConfig,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(deps.get_session),
    current_user: Any = Depends(deps.check_permissions([deps.Role.ADMIN, deps.Role.MANAGER]))
):
    # Check if document already exists
    stmt = select(Document).where(
        Document.application_name == doc_in.application_name,
        Document.name == doc_in.document_name
    )
    result = await session.execute(stmt)
    doc = result.scalar_one_or_none()

    if doc:
        # Update existing document
        doc.url = str(doc_in.url)
        doc.keywords = doc_in.keywords
        doc.schedule = doc_in.schedule
        session.add(doc)
        await session.commit()
        await session.refresh(doc)
    else:
        # Create new document
        doc = Document(
            application_name=doc_in.application_name,
            name=doc_in.document_name, # Map Pydantic 'document_name' to DB 'name'
            url=str(doc_in.url),
            keywords=doc_in.keywords,
            schedule=doc_in.schedule
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)
    
    # Auto-trigger execution
    from app.db.models import Execution, ExecutionStatus
    from app.core.tasks import run_pipeline_task
    
    execution = Execution(status=ExecutionStatus.PENDING)
    session.add(execution)
    await session.commit()
    await session.refresh(execution)
    
    # Schedule the document
    from app.services.scheduler import SchedulerService
    try:
        SchedulerService().schedule_document(doc)
    except Exception as e:
        # Don't fail the request if scheduling fails, just log it
        print(f"Failed to schedule document: {e}")

    background_tasks.add_task(run_pipeline_task, execution.id, [doc.id])
    
    # Manually attach execution ID to response
    doc.latest_execution_id = execution.id
    return doc

@router.put("/{id}", response_model=DocumentResponse)
async def update_document(
    id: str,
    doc_in: DocumentConfig,
    session: AsyncSession = Depends(deps.get_session),
    current_user: Any = Depends(deps.check_permissions([deps.Role.ADMIN, deps.Role.MANAGER]))
):
    """
    Update a document's configuration.
    """
    doc = await session.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.application_name = doc_in.application_name
    # Don't update name if it maps to document_name, keep simple for now
    doc.name = doc_in.document_name
    doc.url = str(doc_in.url)
    doc.keywords = doc_in.keywords
    doc.schedule = doc_in.schedule
    
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    
    # Update Scheduler
    from app.services.scheduler import SchedulerService
    try:
        SchedulerService().schedule_document(doc)
    except Exception as e:
        print(f"Failed to update schedule: {e}")
        
    return doc

from app.schemas.config import DocumentConfig, DocumentResponse, VersionSchema

@router.get("/{id}/versions", response_model=List[VersionSchema])
async def get_document_versions(
    id: str,
    session: AsyncSession = Depends(deps.get_session)
):
    """
    List all versions for a specific document.
    """
    # Verify document exists
    stmt = select(Document).where(Document.id == id)
    result = await session.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fetch versions
    # We need to import Version here to avoid circular imports if any, or ensure it's imported at top
    from app.db.models import Version
    stmt = select(Version).where(Version.document_id == id).order_by(desc(Version.timestamp))
    result = await session.execute(stmt)
    versions = result.scalars().all()
    return versions

from app.core.security import Role
@router.delete("/{id}", status_code=204, dependencies=[Depends(deps.check_permissions([Role.ADMIN]))])
async def delete_document(
    id: str,
    session: AsyncSession = Depends(deps.get_session)
):
    """
    Delete a document. Only for ADMINs.
    """
    doc = await session.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await session.delete(doc)
    await session.commit()
    await session.delete(doc)
    await session.commit()
    
    # Remove from scheduler
    from app.services.scheduler import SchedulerService
    SchedulerService().unschedule_document(doc.id)
    
    return None
