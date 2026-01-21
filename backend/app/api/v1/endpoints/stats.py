from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api import deps
from app.db.models import Document, Execution, Version

router = APIRouter()

@router.get("/")
async def get_stats(session: AsyncSession = Depends(deps.get_session)):
    # Count Documents
    docs_stmt = select(func.count(Document.id))
    docs_count = (await session.execute(docs_stmt)).scalar() or 0
    
    # Count Executions
    execs_stmt = select(func.count(Execution.id))
    execs_count = (await session.execute(execs_stmt)).scalar() or 0
    
    # Count Recent Versions (last 7 days - simplified to total for now)
    vers_stmt = select(func.count(Version.id))
    vers_count = (await session.execute(vers_stmt)).scalar() or 0
    
    return {
        "documents_count": docs_count,
        "executions_count": execs_count,
        "versions_count": vers_count,
        "active_workers": "IDLE" # Placeholder
    }
