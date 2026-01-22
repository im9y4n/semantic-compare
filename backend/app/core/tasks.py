import uuid
from typing import List, Optional
from sqlalchemy import select
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
                    
                    execution.status = ExecutionStatus.COMPLETED
                except Exception as e:
                    logger.error(f"Pipeline failed: {e}")
                    execution.status = ExecutionStatus.FAILED
                    execution.logs = f"Error: {str(e)}\n{traceback.format_exc()}"
                    raise e # Re-raise to trigger outer catch if needed, but we handled the DB update
                finally:
                    execution.end_time = datetime.utcnow()
                    await session.commit()
        except Exception as e:
            logger.error(f"Critical task failure: {e}")
            # Try to recover execution state if session is still valid
            try:
                 execution = await session.get(Execution, execution_id)
                 if execution:
                     execution.status = ExecutionStatus.FAILED
                     execution.logs = f"Critical Failure: {str(e)}"
                     execution.end_time = datetime.utcnow()
                     await session.commit()
            except:
                pass # Session might be broken
