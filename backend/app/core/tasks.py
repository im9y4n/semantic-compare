import uuid
from typing import List, Optional
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Execution, ExecutionStatus, Document
from app.services.pipeline import PipelineService

async def run_pipeline_task(execution_id: uuid.UUID, document_ids: Optional[List[uuid.UUID]] = None):
    # Create a new session for the background task
    async with AsyncSessionLocal() as session:
        pipeline = PipelineService(session)
        
        # Get docs
        if document_ids:
            stmt = select(Document).where(Document.id.in_(document_ids))
        else:
            stmt = select(Document)
            
        result = await session.execute(stmt)
        docs = result.scalars().all()
        
        # Update execution status
        execution = await session.get(Execution, execution_id)
        if execution:
            execution.status = ExecutionStatus.RUNNING
            await session.commit()
            
            for doc in docs:
                await pipeline.process_document(doc.id, execution_id)
                
            execution.status = ExecutionStatus.COMPLETED
            # execution.end_time = ...
            await session.commit()
