@echo off
chcp 65001 >nul
title Comipara 6 — Installer

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     Comipara 6 Map — Auto Installer      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Cek Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js tidak ditemukan!
    echo.
    echo  Silakan install Node.js LTS terlebih dahulu:
    echo  https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js ditemukan: %NODE_VER%

:: ── Cek npm ─────────────────────────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm tidak ditemukan. Install ulang Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm ditemukan: %NPM_VER%
echo.

:: ── Install dependencies ─────────────────────────────────────────────────
echo  [1/4] Menginstall dependencies (better-sqlite3, next, react, dll.)...
echo        Ini mungkin memakan waktu 2-5 menit...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install gagal!
    echo  Pastikan koneksi internet aktif dan coba lagi.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencies berhasil diinstall.
echo.

:: ── Migrasi data JSON lama ───────────────────────────────────────────────
if exist "data\users.json" (
    echo  [2/4] Ditemukan data JSON lama, menjalankan migrasi ke SQLite...
    call npm run migrate
    if %errorlevel% neq 0 (
        echo  [WARN] Migrasi gagal, tapi bisa dilanjut. Cek data manual nanti.
    ) else (
        echo  [OK] Migrasi data selesai.
    )
) else (
    echo  [2/4] Tidak ada data JSON lama — database baru akan dibuat otomatis.
)
echo.

:: ── Build untuk production (opsional di dev) ────────────────────────────
echo  [3/4] Apakah ingin build untuk production sekarang?
echo        (Pilih N jika hanya ingin development/testing)
echo.
set /p BUILD_NOW="  Build sekarang? (y/N): "
if /i "%BUILD_NOW%"=="y" (
    echo.
    echo  Building... ini bisa memakan waktu 1-3 menit...
    call npm run build
    if %errorlevel% neq 0 (
        echo  [ERROR] Build gagal! Cek error di atas.
        pause
        exit /b 1
    )
    echo  [OK] Build selesai.
) else (
    echo  [SKIP] Build dilewati.
)
echo.

:: ── Selesai ──────────────────────────────────────────────────────────────
echo  [4/4] Setup selesai!
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║           Setup Berhasil! 🎉             ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Jalankan development server:            ║
echo  ║    npm run dev                           ║
echo  ║                                          ║
echo  ║  Buka browser:                           ║
echo  ║    http://localhost:3000                 ║
echo  ║                                          ║
echo  ║  Login dashboard (rahasia):              ║
echo  ║    http://localhost:3000/cp6-staff       ║
echo  ╚══════════════════════════════════════════╝
echo.

set /p START_NOW="  Jalankan 'npm run dev' sekarang? (Y/n): "
if /i not "%START_NOW%"=="n" (
    echo.
    echo  Menjalankan development server...
    echo  Tekan Ctrl+C untuk menghentikan.
    echo.
    npm run dev
)

pause
