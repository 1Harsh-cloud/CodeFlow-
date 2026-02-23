@echo off
cd /d "%~dp0backend"
if not exist app.py (
  echo ERROR: app.py not found in backend folder!
  pause
  exit /b 1
)
echo Starting CodeFlow Backend...
echo.
pip install -r requirements.txt -q 2>nul
python app.py
pause
