"""
DDoS Sentinel ML Service - Dockerfile
Simple setup for Python FastAPI service
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

if __name__ == "__main__":
    import subprocess
    subprocess.run([sys.executable, "main.py"])
