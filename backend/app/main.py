from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        debug=settings.DEBUG,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.api.api import api_router
    application.include_router(api_router, prefix=settings.API_V1_STR)
    
    @application.on_event("startup")
    async def startup_event():
        from app.services.scheduler import SchedulerService
        scheduler = SchedulerService()
        scheduler.start()
        await scheduler.load_jobs()

    return application

app = get_application()

@app.get("/")
async def root():
    return {"message": "Welcome to Semantic Document Monitor API", "docs": "/docs"}





