import logging
import uuid
import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models import Document
from app.core.tasks import run_pipeline_task

logger = logging.getLogger(__name__)

def log_debug(msg):
    with open("scheduler_debug.log", "a") as f:
        f.write(f"[{datetime.datetime.now()}] {msg}\n")


class SchedulerService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SchedulerService, cls).__new__(cls)
            cls._instance.scheduler = AsyncIOScheduler()
            cls._instance.started = False
        return cls._instance

    def start(self):
        if not self.started:
            self.scheduler.start()
            self.started = True
            log_debug("Scheduler started")
            
            # Add heartbeat job
            self.scheduler.add_job(
                self._heartbeat,
                'interval',
                minutes=1,
                id='heartbeat',
                replace_existing=True
            )
            log_debug("Heartbeat job added")

    async def _heartbeat(self):
        log_debug("Heartbeat: Alive")

    async def load_jobs(self):
        """Load all documents with schedules from DB and schedule them."""
        log_debug("Loading scheduled jobs from database...")
        async with AsyncSessionLocal() as session:
            stmt = select(Document).where(Document.schedule.isnot(None))
            result = await session.execute(stmt)
            documents = result.scalars().all()
            
            for doc in documents:
                self.schedule_document(doc)
            
            log_debug(f"Loaded {len(documents)} scheduled jobs.")

    def schedule_document(self, document: Document):
        """Add or update a job for the document."""
        if not document.schedule:
            self.unschedule_document(document.id)
            return

        job_id = str(document.id)
        cron_expr = document.schedule

        # Handle aliases
        if cron_expr == "weekly":
            cron_expr = "0 0 * * 0" # Weekly at midnight Sunday
        elif cron_expr == "daily":
            cron_expr = "0 0 * * *" # Daily at midnight

        try:
            # Parse cron expression
            parts = cron_expr.split()
            if len(parts) != 5:
                log_debug(f"Invalid cron expression for doc {document.id}: {cron_expr}")
                return

            trigger = CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4]
            )

            # Add or replace job
            self.scheduler.add_job(
                run_pipeline_job,
                trigger=trigger,
                id=job_id,
                replace_existing=True,
                args=[document.id],
                name=f"pipeline_{document.name}"
            )
            log_debug(f"Successfully scheduled job for doc {document.id} with schedule '{cron_expr}'")
            job = self.scheduler.get_job(job_id)
            if job:
                log_debug(f"Job {job_id} confirmed. Next run: {job.next_run_time}")
            else:
                log_debug(f"WARNING: Job {job_id} NOT found after adding!")

        except Exception as e:
            log_debug(f"Error scheduling doc {document.id}: {e}")

    def unschedule_document(self, document_id: uuid.UUID):
        """Remove job if exists."""
        job_id = str(document_id)
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            log_debug(f"Removed job for doc {document_id}")

# Wrapper to be called by APScheduler
async def run_pipeline_job(document_id: uuid.UUID):
    log_debug(f"Triggering scheduled pipeline for doc {document_id}")
    try:
        # We start the task. Note: APScheduler runs in the event loop, so this is fine.
        # run_pipeline_task creates its own session and handles logic.
        new_execution_id = uuid.uuid4()
        log_debug(f"Generated Execution ID: {new_execution_id}")
        await run_pipeline_task(new_execution_id, [document_id])
    except Exception as e:
        log_debug(f"Scheduled pipeline execution failed for {document_id}: {e}")
