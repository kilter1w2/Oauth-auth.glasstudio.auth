@echo off
setlocal enabledelayedexpansion

:: GLAStudio OAuth Development Start Script
:: This script helps you start the development environment quickly

echo.
echo ========================================
echo   GLAStudio OAuth Development Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version

:: Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ npm is available
npm --version

:: Check if .env.local exists
if not exist ".env.local" (
    echo.
    echo ⚠️  Environment file not found!
    echo.
    echo Creating .env.local from .env.example...

    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo ✅ Created .env.local from .env.example
        echo.
        echo 🔧 IMPORTANT: You need to configure your environment variables:
        echo    1. Open .env.local in your text editor
        echo    2. Set your Firebase Admin SDK credentials
        echo    3. Generate secure secrets for JWT_SECRET and ENCRYPTION_KEY
        echo    4. Configure your tunnel domain if using one
        echo.
        echo Press any key to continue once you've configured .env.local...
        pause >nul
    ) else (
        echo ❌ .env.example not found. Please create .env.local manually.
        echo Refer to SETUP_GUIDE.md for configuration instructions.
        pause
        exit /b 1
    )
)

echo ✅ Environment file exists

:: Check if node_modules exists
if not exist "node_modules" (
    echo.
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

:: Check for development tools
echo.
echo 🔍 Checking for development tools...

:: Check for ngrok
ngrok version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  ngrok not found. OAuth callbacks may not work without tunneling.
    echo   Install ngrok from: https://ngrok.com/download
    echo   Or use cloudflared tunnel as alternative.
    set HAS_NGROK=false
) else (
    echo ✅ ngrok is available
    ngrok version
    set HAS_NGROK=true
)

echo.
echo ========================================
echo   Starting Development Environment
echo ========================================
echo.

:: Ask user about tunnel preference
if "%HAS_NGROK%"=="true" (
    echo Would you like to start with tunneling? (y/n^)
    echo (Required for OAuth callbacks to work^)
    set /p TUNNEL_CHOICE="Enter choice: "

    if /i "!TUNNEL_CHOICE!"=="y" (
        set USE_TUNNEL=true
    ) else (
        set USE_TUNNEL=false
    )
) else (
    set USE_TUNNEL=false
)

:: Display startup information
echo.
echo 🚀 Starting services...
echo.

if "%USE_TUNNEL%"=="true" (
    echo Starting Next.js development server and ngrok tunnel...
    echo.
    echo 📝 Instructions:
    echo    1. Wait for both services to start
    echo    2. Copy the ngrok HTTPS URL (https://xxxxx.ngrok.io^)
    echo    3. Update your .env.local with the tunnel URL
    echo    4. Add the tunnel domain to Firebase authorized domains
    echo    5. Update Google OAuth redirect URIs
    echo.

    :: Start Next.js in background
    start "Next.js Dev Server" cmd /c "npm run dev"

    :: Wait a moment for Next.js to start
    timeout /t 5 /nobreak >nul

    echo Starting ngrok tunnel...
    echo Visit http://localhost:4040 to inspect tunnel requests
    echo.

    :: Start ngrok tunnel
    ngrok http 3000

) else (
    echo Starting Next.js development server...
    echo.
    echo 📝 Next steps:
    echo    1. Visit http://localhost:3000 to access your OAuth system
    echo    2. Check /api/health endpoint to verify setup
    echo    3. Set up tunneling if you need OAuth callbacks to work
    echo.
    echo 🔧 To enable OAuth callbacks:
    echo    - Install ngrok: https://ngrok.com/download
    echo    - Run this script again and choose 'y' for tunneling
    echo    - Or manually run: ngrok http 3000
    echo.

    :: Start Next.js normally
    call npm run dev
)

:: If we get here, the servers have stopped
echo.
echo 🛑 Development servers stopped
echo.

:: Check if ngrok is still running and offer to stop it
tasklist /fi "imagename eq ngrok.exe" 2>nul | find /i "ngrok.exe" >nul
if not errorlevel 1 (
    echo ngrok is still running. Stop it? (y/n^)
    set /p STOP_NGROK="Enter choice: "
    if /i "!STOP_NGROK!"=="y" (
        taskkill /f /im ngrok.exe >nul 2>&1
        echo ✅ ngrok stopped
    )
)

echo.
echo 👋 Thanks for using GLAStudio OAuth!
echo.
pause
