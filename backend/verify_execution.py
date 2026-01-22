import asyncio
import sys
import os
from sqlalchemy import select
from uuid import UUID

sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.models import Execution

async def main():
    exec_id = "f0d231f1-ad59-482f-a748-3e964f074bdb"
    print(f"Checking for Execution: {exec_id}")
    async with AsyncSessionLocal() as session:
        stmt = select(Execution).where(Execution.id == UUID(exec_id))
        result = await session.execute(stmt)
        execution = result.scalar_one_or_none()
        
        if execution:
            print(f"FOUND: Execution {execution.id}")
            print(f"Status: {execution.status}")
            print(f"Start Time: {execution.start_time}")
            print(f"Steps: {execution.steps}")
        else:
            print("NOT FOUND")

if __name__ == "__main__":
    asyncio.run(main())
