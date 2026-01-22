from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Any, List, Optional
import uuid

from app.api import deps
from app.db.models import Execution, ExecutionStatus, Document
from app.services.pipeline import PipelineService
from app.db.session import AsyncSessionLocal

router = APIRouter()

from app.core.tasks import run_pipeline_task

@router.post("/run", status_code=202)
async def trigger_run(
    document_id: Optional[uuid.UUID] = None,
    background_tasks: BackgroundTasks = None, 
    session: AsyncSession = Depends(deps.get_session),
    current_user: Any = Depends(deps.check_permissions([deps.Role.ADMIN, deps.Role.MANAGER]))
):
    """
    Trigger an on-demand execution. Optionally filter by document_id.
    """
    if background_tasks is None: 
         # in case it wasn't injected correctly, though strictly it should be
         from fastapi import BackgroundTasks
         background_tasks = BackgroundTasks()

    execution = Execution(status=ExecutionStatus.PENDING)
    session.add(execution)
    await session.commit()
    await session.refresh(execution)
    
    doc_ids = [document_id] if document_id else None
    
    background_tasks.add_task(run_pipeline_task, execution.id, doc_ids)
    
    return {"execution_id": execution.id, "status": "pending"}

from app.schemas.config import ExecutionSchema

@router.get("/", response_model=List[ExecutionSchema])
async def list_executions(
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(deps.get_session)
):
    stmt = select(Execution).order_by(desc(Execution.start_time)).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()
