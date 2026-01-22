import asyncio
from sqlalchemy import select, desc
from app.db.session import AsyncSessionLocal
from app.db.models import Execution

async def check():
    async with AsyncSessionLocal() as session:
        stmt = select(Execution).order_by(desc(Execution.start_time)).limit(5)
        res = await session.execute(stmt)
        exs = res.scalars().all()
        for ex in exs:
             print(f"ID: {ex.id} | Status: {ex.status} | Logs: {ex.logs}")

if __name__ == "__main__":
    asyncio.run(check())
