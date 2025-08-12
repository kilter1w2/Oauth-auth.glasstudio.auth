@echo off
echo ========================================
echo Firebase Admin SDK Quick Fix
echo ========================================
echo.
echo This script will help you fix the Firebase Admin SDK configuration.
echo.
echo STEP 1: Get Firebase Service Account Key
echo ----------------------------------------
echo 1. Go to: https://console.firebase.google.com/
echo 2. Select your project: itdiary-ase
echo 3. Go to Project Settings ^> Service Accounts
echo 4. Click "Generate new private key"
echo 5. Download the JSON file
echo.
echo STEP 2: Update Environment Variables
echo -----------------------------------
echo Open the downloaded JSON file and copy:
echo - project_id
echo - private_key (the entire string including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)
echo - client_email
echo.
echo Then update your .env.local file with these values.
echo.
echo STEP 3: Alternative - Use our setup script
echo ------------------------------------------
echo Run: node setup-firebase.js
echo (This will automatically configure your .env.local file)
echo.
pause
