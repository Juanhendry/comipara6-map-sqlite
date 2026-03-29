#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Comipara 6 Map — Auto Installer (Linux / Mac / VPS Ubuntu)
#  Jalankan: bash install.sh
# ─────────────────────────────────────────────────────────────────
set -e

# Warna
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${RESET}   $1"; }
info() { echo -e "  ${CYAN}[INFO]${RESET} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${RESET} $1"; }
err()  { echo -e "  ${RED}[ERROR]${RESET} $1"; }
step() { echo -e "\n${BOLD}${CYAN}[$1/5]${RESET}${BOLD} $2${RESET}"; }

echo ""
echo -e "${BOLD}${CYAN} ╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN} ║    Comipara 6 Map — Auto Installer       ║${RESET}"
echo -e "${BOLD}${CYAN} ╚══════════════════════════════════════════╝${RESET}"
echo ""

# ── Pastikan script dijalankan dari folder project ──────────────────────────
if [ ! -f "package.json" ]; then
    err "package.json tidak ditemukan!"
    echo "     Pastikan kamu menjalankan script ini dari dalam folder project:"
    echo "     cd comipara6-map && bash install.sh"
    exit 1
fi

# ── [1/5] Cek Node.js ────────────────────────────────────────────────────────
step 1 "Memeriksa Node.js"

if ! command -v node &>/dev/null; then
    err "Node.js tidak ditemukan!"
    echo ""
    echo "     Untuk VPS Ubuntu, install dengan NVM:"
    echo "       curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "       source ~/.bashrc"
    echo "       nvm install --lts"
    echo ""
    echo "     Lalu jalankan script ini lagi."
    exit 1
fi

NODE_VER=$(node --version)
NODE_MAJOR=$(node --version | cut -d'.' -f1 | tr -d 'v')
ok "Node.js ditemukan: $NODE_VER"

if [ "$NODE_MAJOR" -lt 18 ]; then
    warn "Node.js versi $NODE_VER terlalu lama. Disarankan v18 atau lebih baru."
    warn "Jalankan: nvm install --lts && nvm use --lts"
fi

NPM_VER=$(npm --version)
ok "npm ditemukan: v$NPM_VER"

# ── [2/5] Cek build tools (wajib untuk better-sqlite3) ──────────────────────
step 2 "Memeriksa build tools (untuk better-sqlite3)"

IS_LINUX=false
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IS_LINUX=true
fi

if $IS_LINUX; then
    if ! command -v gcc &>/dev/null; then
        warn "gcc tidak ditemukan. Menginstall build-essential..."
        if command -v apt &>/dev/null; then
            sudo apt update -qq && sudo apt install -y build-essential
            ok "build-essential berhasil diinstall."
        else
            err "Tidak bisa auto-install. Install manual: sudo apt install build-essential"
            exit 1
        fi
    else
        ok "gcc ditemukan: $(gcc --version | head -1)"
    fi
else
    info "macOS terdeteksi — pastikan Xcode Command Line Tools sudah diinstall."
    info "Jika belum: xcode-select --install"
fi

# ── [3/5] Install dependencies ───────────────────────────────────────────────
step 3 "Menginstall npm dependencies"
info "Ini mungkin memakan waktu 2-5 menit (mengkompilasi better-sqlite3)..."
echo ""

npm install

ok "Dependencies berhasil diinstall."

# ── [4/5] Migrasi data JSON lama ─────────────────────────────────────────────
step 4 "Migrasi data"

if [ -f "data/users.json" ]; then
    info "Ditemukan data JSON lama. Menjalankan migrasi ke SQLite..."
    if npm run migrate; then
        ok "Migrasi data selesai."
    else
        warn "Migrasi gagal — lanjutkan manual dengan: npm run migrate"
    fi
else
    info "Tidak ada data JSON lama — database SQLite baru akan dibuat otomatis saat server jalan."
fi

# ── [5/5] Build ──────────────────────────────────────────────────────────────
step 5 "Build"

# Deteksi apakah ini VPS/production atau local
if [ "$1" == "--production" ] || [ "$1" == "-p" ]; then
    info "Mode production — menjalankan npm run build..."
    npm run build
    ok "Build selesai."
    echo ""
    echo -e "${BOLD}${GREEN}"
    echo " ╔══════════════════════════════════════════╗"
    echo " ║        Setup Production Selesai! 🎉      ║"
    echo " ╠══════════════════════════════════════════╣"
    echo " ║  Jalankan dengan PM2:                    ║"
    echo " ║    pm2 start npm --name comipara6 -- start ║"
    echo " ║    pm2 save && pm2 startup               ║"
    echo " ║                                          ║"
    echo " ║  Atau langsung:                          ║"
    echo " ║    npm start                             ║"
    echo " ╚══════════════════════════════════════════╝"
    echo -e "${RESET}"
else
    info "Mode development — skip build."
    info "(Gunakan 'bash install.sh --production' untuk build sekalian)"
    echo ""
    echo -e "${BOLD}${GREEN}"
    echo " ╔══════════════════════════════════════════╗"
    echo " ║          Setup Dev Selesai! 🎉           ║"
    echo " ╠══════════════════════════════════════════╣"
    echo " ║  Jalankan development server:            ║"
    echo " ║    npm run dev                           ║"
    echo " ║                                          ║"
    echo " ║  Buka browser:                           ║"
    echo " ║    http://localhost:3000                 ║"
    echo " ║                                          ║"
    echo " ║  Login dashboard (rahasia):              ║"
    echo " ║    http://localhost:3000/cp6-staff       ║"
    echo " ╚══════════════════════════════════════════╝"
    echo -e "${RESET}"

    # Tanya mau langsung npm run dev?
    echo ""
    read -r -p "  Jalankan 'npm run dev' sekarang? (Y/n): " START_NOW
    START_NOW=${START_NOW:-Y}
    if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
        echo ""
        info "Menjalankan development server..."
        info "Tekan Ctrl+C untuk menghentikan."
        echo ""
        npm run dev
    fi
fi
