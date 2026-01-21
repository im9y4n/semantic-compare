from fastapi import APIRouter
from app.api.v1.endpoints import config, executions, documents, stats, versions, upload

api_router = APIRouter()
api_router.include_router(config.router, prefix="/config", tags=["config"])
api_router.include_router(executions.router, prefix="/executions", tags=["executions"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(versions.router, prefix="/versions", tags=["versions"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
