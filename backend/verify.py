import requests
import time
import sys

API_URL = "http://localhost:8000/api/v1"

def test_flow():
    # 1. Config Import
    print("Importing configuration...")
    config = {
        "documents": [
            {
                "application_name": "Test App",
                "document_name": "Test Doc",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "schedule": "daily"
            }
        ]
    }
    
    try:
        res = requests.post(f"{API_URL}/config/import", json=config)
        res.raise_for_status()
        print(f"Config Import: {res.json()}")
    except Exception as e:
        print(f"Config Import Failed: {e}")
        sys.exit(1)

    # 2. Trigger Run
    print("\nTriggering execution...")
    try:
        res = requests.post(f"{API_URL}/executions/run")
        res.raise_for_status()
        data = res.json()
        execution_id = data["execution_id"]
        print(f"Execution started: {execution_id}")
    except Exception as e:
        print(f"Execution Start Failed: {e}")
        sys.exit(1)
        
    # Wait
    print("Waiting for execution...")
    time.sleep(5)
    
    print("Done. Check logs or UI.")

if __name__ == "__main__":
    test_flow()
