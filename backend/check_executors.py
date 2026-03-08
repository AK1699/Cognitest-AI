import sys
import os
# Add the backend to path
sys.path.append(os.getcwd())
from app.api.v1.web_automation import active_executors
print(f"Active Executors: {list(active_executors.keys())}")
