import asyncio
import uuid
from datetime import datetime, timedelta
import random

from app.db.session import AsyncSessionLocal
from app.db.models import Document, Execution, Version, ExecutionStatus

async def seed_data():
    async with AsyncSessionLocal() as session:
        print("Seeding database...")
        
        # Create Documents
        docs = [
            Document(id=uuid.uuid4(), application_name="Medicaid Portal", name="Privacy Policy", url="https://example.com/privacy.pdf", schedule="daily"),
            Document(id=uuid.uuid4(), application_name="Payments Gateway", name="Terms of Service", url="https://example.com/tos.pdf", schedule="daily"),
            Document(id=uuid.uuid4(), application_name="Developer Hub", name="API Documentation", url="https://example.com/api.html", schedule="weekly"),
            Document(id=uuid.uuid4(), application_name="HR System", name="Employee Handbook", url="https://example.com/handbook.pdf", schedule="monthly"),
        ]
        session.add_all(docs)
        
        # Create Executions & Versions
        for _ in range(10):
            status = random.choice([ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.PENDING])
            start_time = datetime.utcnow() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
            end_time = start_time + timedelta(seconds=random.randint(10, 300)) if status == ExecutionStatus.COMPLETED else None
            
            execution = Execution(
                id=uuid.uuid4(),
                status=status,
                start_time=start_time,
                end_time=end_time,
                logs="Sample execution logs..."
            )
            session.add(execution)
            
            if status == ExecutionStatus.COMPLETED:
                # Add some versions
                doc = random.choice(docs)
                version = Version(
                    id=uuid.uuid4(),
                    document_id=doc.id,
                    execution_id=execution.id,
                    timestamp=end_time,
                    content_hash="mock_hash_123",
                    gcs_path=f"gs://bucket/{doc.name}_{end_time.isoformat()}.pdf",
                    semantic_score=random.random()
                )
                session.add(version)
        
        await session.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
