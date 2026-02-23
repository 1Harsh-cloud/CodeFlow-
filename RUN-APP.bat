@echo off
title CodeFlow - Backend
cd /d "%~dp0backend"
if not exist app.py (
  echo ERROR: app.py not found! Check backend folder.
  pause
  exit /b 1
)
echo ============================================
echo   CodeFlow Backend - KEEP THIS WINDOW OPEN
echo ============================================
echo.
echo Installing dependencies...
pip install -r requirements.txt -q 2>nul
echo.
echo Starting backend on http://localhost:5000
echo.
python app.py
pause
