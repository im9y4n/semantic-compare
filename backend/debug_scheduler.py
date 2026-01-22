import asyncio
import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from app.services.scheduler import SchedulerService

async def main():
    print("Starting manual scheduler test...")
    s = SchedulerService()
    s.start()
    print("Scheduler started. Waiting 70 seconds to capture heartbeat...")
    await asyncio.sleep(70)
    print("Test finsihed.")

if __name__ == "__main__":
    asyncio.run(main())
