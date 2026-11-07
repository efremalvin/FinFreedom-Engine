@echo off
title FinFreedom Engine - Next.js Development Server
color 0A

echo ===================================================================
echo               FINFREEDOM ENGINE - SIMULATOR FINANSIAL
echo        Financial Independence & SWR Retirement Stress-Test ID
echo ===================================================================
echo.

:: Periksa apakah Node.js terpasang
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan di sistem ini.
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org/
    pause
    exit /b 1
)

:: Periksa apakah folder node_modules ada
if not exist "node_modules\" (
    echo [INFO] Folder node_modules belum ditemukan.
    echo [INFO] Menjalankan 'npm install'...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Gagal menginstal dependensi.
        pause
        exit /b 1
    )
)

echo [INFO] Membuka simulator di browser: http://localhost:3000 ...
start "" http://localhost:3000

echo [INFO] Menjalankan server Next.js (npm run dev)...
echo [INFO] Tekan Ctrl + C untuk menghentikan server.
echo.

call npm run dev

pause
