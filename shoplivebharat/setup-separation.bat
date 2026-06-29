#!/bin/bash
# Windows batch script version of setup

@echo off
setlocal enabledelayedexpansion

echo 🚀 ShopLive Bharat - Website Separation Setup
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "frontend\" (
    echo ❌ Error: frontend directory not found
    exit /b 1
)

if not exist "waiting-page\" (
    echo ❌ Error: waiting-page directory not found
    exit /b 1
)

echo 📂 Copying shared components...

REM Create directories if they don't exist
if not exist "waiting-page\src\components" mkdir "waiting-page\src\components"
if not exist "waiting-page\src\lib" mkdir "waiting-page\src\lib"
if not exist "waiting-page\src\hooks" mkdir "waiting-page\src\hooks"
if not exist "waiting-page\src\contexts" mkdir "waiting-page\src\contexts"

REM Copy components
if exist "frontend\src\components" (
    xcopy "frontend\src\components\*" "waiting-page\src\components\" /E /Y /I >nul 2>&1
    echo ✅ Components copied
) else (
    echo ⚠️  frontend\src\components not found
)

REM Copy lib utilities
if exist "frontend\src\lib" (
    xcopy "frontend\src\lib\*" "waiting-page\src\lib\" /E /Y /I >nul 2>&1
    echo ✅ Library utilities copied
) else (
    echo ⚠️  frontend\src\lib not found
)

REM Copy hooks
if exist "frontend\src\hooks" (
    xcopy "frontend\src\hooks\*" "waiting-page\src\hooks\" /E /Y /I >nul 2>&1
    echo ✅ Hooks copied
) else (
    echo ⚠️  frontend\src\hooks not found
)

REM Copy contexts
if exist "frontend\src\contexts" (
    xcopy "frontend\src\contexts\*" "waiting-page\src\contexts\" /E /Y /I >nul 2>&1
    echo ✅ Contexts copied
) else (
    echo ⚠️  frontend\src\contexts not found
)

echo.
echo 📦 Installing dependencies...
echo.

echo Installing marketplace dependencies...
cd frontend
if exist "yarn.lock" (
    call yarn install --frozen-lockfile
) else (
    call npm install
)
cd ..

echo.
echo Installing waiting page dependencies...
cd waiting-page
if exist "yarn.lock" (
    call yarn install --frozen-lockfile
) else (
    call npm install
)
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo.
echo 1. Create .env files:
echo    copy frontend\.env.example frontend\.env
echo    copy waiting-page\.env.example waiting-page\.env
echo.
echo 2. Start development servers:
echo    Terminal 1: cd frontend ^&^& yarn start
echo    Terminal 2: cd waiting-page ^&^& yarn start
echo.
echo 3. For production deployment, see SEPARATION_GUIDE.md
echo.

pause
