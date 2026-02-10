@echo off
REM Git Flow Master - Web Interface Launcher (Windows)

echo.
echo ========================================
echo   Git Flow Master - Web Interface
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Get script directory
set SCRIPT_DIR=%~dp0
set WEB_DIR=%SCRIPT_DIR%web

REM Check if dependencies are installed
if not exist "%WEB_DIR%\node_modules" (
    echo [INFO] Installing dependencies...
    cd /d "%WEB_DIR%"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start server
echo.
echo ========================================
echo   Server starting at http://localhost:3747
echo   Press Ctrl+C to stop
echo ========================================
echo.

cd /d "%WEB_DIR%"
call npm start
