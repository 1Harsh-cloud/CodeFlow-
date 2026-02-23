@echo off
cd /d "%~dp0frontend"
echo Starting CodeFlow Frontend...
echo.
call npm install 2>nul
call npm run dev
pause
