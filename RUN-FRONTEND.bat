@echo off
title CodeFlow - Frontend
cd /d "%~dp0frontend"
echo ============================================
echo   CodeFlow Frontend
echo ============================================
echo.
call npm install 2>nul
echo.
echo Starting frontend...
echo Open http://localhost:5173 in your browser
echo.
call npm run dev
pause
