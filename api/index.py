import os
import sys

# Ensure project root is on sys.path to import app.py
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import app as application  # Vercel expects variable named `app` or `application`

# Optional: expose `app` name as well
app = application


