import uuid
from typing import List, Optional
from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.db.models import Execution, ExecutionStatus, Document
from app.services.pipeline import PipelineService

import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

async def run_pipeline_task(execution_id: uuid.UUID, document_ids: Optional[List[uuid.UUID]] = None):
    # Create a new session for the background task
    async with AsyncSessionLocal() as session:
        try:
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
                
                try:
                    for doc in docs:
                        await pipeline.process_document(doc.id, execution_id)
                    
                    # Direct update to avoid overwriting steps/logs with stale object state
                    stmt = update(Execution).where(Execution.id == execution_id).values(
                        status=ExecutionStatus.COMPLETED,
                        end_time=datetime.utcnow()
                    )
                    await session.execute(stmt)
                    await session.commit()

                except Exception as e:
                    logger.error(f"Pipeline failed: {e}")
                    
                    # Append error to existing logs via concat (Postgres specific) or just update
                    # For safety, we just update status and append to a potentially stale log or just set logs
                    # Ideally we fetch logs first, but direct update is safer for status.
                    stmt = update(Execution).where(Execution.id == execution_id).values(
                        status=ExecutionStatus.FAILED,
                        end_time=datetime.utcnow(),
                        logs=Execution.logs + f"\nError: {str(e)}\n{traceback.format_exc()}"
                    )
                    await session.execute(stmt)
                    await session.commit()
                    
                    raise e
        except Exception as e:
            logger.error(f"Critical task failure: {e}")
            try:
                 stmt = update(Execution).where(Execution.id == execution_id).values(
                     status=ExecutionStatus.FAILED,
                     logs=Execution.logs + f"\nCritical Failure: {str(e)}" if Execution.logs else f"Critical Failure: {str(e)}",
                     end_time=datetime.utcnow()
                 )
                 await session.execute(stmt)
                 await session.commit()
            except:
                pass
