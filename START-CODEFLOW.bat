@echo off
cd /d "%~dp0"
echo Starting CodeFlow...
echo.
echo [1] Opening BACKEND (keep this running)...
start "CodeFlow Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt -q 2>nul && echo Backend starting... && python app.py"
timeout /t 3 /nobreak >nul
echo.
echo [2] Opening FRONTEND...
start "CodeFlow Frontend" cmd /k "cd /d %~dp0frontend && npm install 2>nul && npm run dev"
echo.
echo Two windows opened. Wait for backend to show "Running on http://127.0.0.1:5000"
echo Then open: http://localhost:5173
echo.
pause
