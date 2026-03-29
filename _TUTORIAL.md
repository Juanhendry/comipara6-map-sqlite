# 🗺️ Comipara 6 — Setup Tutorial Lengkap

---

## STRUKTUR FILE PROJECT

```
comipara6-map/                   ← folder project Next.js
├── app/
│   ├── page.jsx                 ← halaman utama (peta)
│   ├── layout.jsx               ← layout global
│   ├── globals.css              ← CSS global
│   ├── cp6-staff/
│   │   └── page.jsx             ← halaman login RAHASIA
│   └── dashboard/
│       └── page.jsx             ← dashboard user/admin
├── components/
│   └── FloorMap.jsx             ← komponen peta interaktif
├── lib/
│   ├── dataStore.js             ← layer data (SQLite)
│   └── lockout.js               ← sistem lockout login (SQLite)
├── scripts/
│   └── migrate-json-to-sqlite.mjs  ← migrasi data lama JSON → SQLite
├── data/
│   └── comipara.db              ← database SQLite (dibuat otomatis)
├── middleware.js                ← proteksi route dashboard
├── tailwind.config.js           ← konfigurasi animasi
└── package.json
```

> ⚠️ **Penyimpanan data menggunakan SQLite** (`data/comipara.db`).
> File JSON lama (`users.json`, `fandoms.json`, dll.) tidak digunakan lagi.

---

## BAGIAN 1 — Install Tools

### Step 1: Install VS Code
1. Buka **https://code.visualstudio.com**
2. Download → Install → centang "Add to PATH"
3. Buka VS Code

### Step 2: Install Node.js
1. Buka **https://nodejs.org**
2. Download versi **LTS**
3. Install → **restart komputer**
4. Cek di terminal VS Code:
```bash
node --version   # harus muncul angka versi
npm --version    # harus muncul angka versi
```

### Step 3: Install Extension VS Code
Buka Extensions (Ctrl+Shift+X), install:
- **ES7+ React/Redux snippets**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**

---

## BAGIAN 2 — Buat Project Next.js

### Step 4: Buat project baru
```bash
cd Desktop
npx create-next-app@latest comipara6-map
```

Jawab pertanyaan:
```
TypeScript?          → No
ESLint?              → Yes
Tailwind CSS?        → Yes
src/ directory?      → No
App Router?          → Yes
Import alias?        → No
```

```bash
cd comipara6-map
code .
```

---

## BAGIAN 3 — Pasang File

### Step 5: Buat folder-folder yang diperlukan
Di terminal VS Code:
```bash
mkdir components
mkdir -p app/cp6-staff
mkdir -p app/dashboard
mkdir lib
mkdir scripts
```

### Step 6: Pasang semua file
Copy-paste file berikut ke posisi yang benar:

| File | Letakkan di |
|------|------------|
| `FloorMap.jsx` | `components/FloorMap.jsx` |
| `page.jsx` (peta) | `app/page.jsx` (ganti isi lama) |
| `cp6-staff/page.jsx` | `app/cp6-staff/page.jsx` |
| `dashboard/page.jsx` | `app/dashboard/page.jsx` |
| `middleware.js` | root project (sejajar package.json) |
| `lib/dataStore.js` | `lib/dataStore.js` |
| `lib/lockout.js` | `lib/lockout.js` |
| `scripts/migrate-json-to-sqlite.mjs` | `scripts/migrate-json-to-sqlite.mjs` |
| `install.bat` | root project (untuk Windows) |
| `install.sh` | root project (untuk Linux/VPS) |

### Step 7: Update globals.css
Buka `app/globals.css`, pastikan ada:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## BAGIAN 4 — Install & Jalankan (Otomatis)

Ada dua script installer yang sudah disertakan di dalam zip — pilih sesuai OS:

---

### 🪟 Windows — `install.bat`

1. Extract zip
2. Buka folder `comipara6-map`
3. **Klik 2x** file `install.bat`
4. Ikuti instruksi di layar

Script akan otomatis:
- Cek Node.js
- Jalankan `npm install`
- Migrasi data JSON lama (jika ada)
- Tanya apakah mau build production
- Tanya apakah mau langsung `npm run dev`

---

### Linux / Mac / VPS Ubuntu — `install.sh`

```bash
cd comipara6-map
bash install.sh
```

Untuk langsung build production sekalian (khusus VPS):
```bash
bash install.sh --production
```

Script akan otomatis:
- Cek Node.js + gcc/build-essential (auto-install jika belum ada)
- Jalankan `npm install`
- Migrasi data JSON lama (jika ada)
- Build production (jika pakai flag `--production`)

---

### Manual (jika script tidak jalan)

```bash
npm install          # install semua dependency
npm run migrate      # migrasi data JSON lama (skip jika fresh)
npm run dev          # jalankan development server
```

> ✅ Database SQLite (`data/comipara.db`) dibuat **otomatis** saat server pertama jalan,
> lengkap dengan akun default Admin dan SuperAdmin.

---

## BAGIAN 5 — URL Penting

| URL | Fungsi |
|-----|--------|
| `http://localhost:3000` | Peta interaktif (publik) |
| `http://localhost:3000/cp6-staff` | Login dashboard (RAHASIA) |
| `http://localhost:3000/dashboard` | Dashboard (setelah login) |

> ⚠️ URL `/cp6-staff` bersifat rahasia — tidak ada link ke sana dari halaman publik!

---

## BAGIAN 6 — Akun Login (Development)

| Email | Password | Role |
|-------|----------|------|
| `admin@comipara.com` | `admin123` | Admin |
| `super@comipara.com` | `super123` | Super Admin |
| email apapun | min 6 karakter | User biasa |

---

## BAGIAN 7 — Fitur Dashboard

### User biasa:
- Lihat booth yang di-assign admin
- Upload katalog gambar
- Buat tabel harga (item + nominal)

### Admin:
- Semua fitur user
- Tambah / edit / lihat semua user
- Assign booth ke user (ketik ID booth)

### Super Admin:
- Semua fitur admin
- Hapus user (termasuk admin)
- Ubah role user

---

## BAGIAN 8 — Cara Pakai Peta

### Cari Fandom:
1. Klik tab "🔍 Cari Fandom"
2. Ketik nama fandom ATAU klik tag fandom
3. Booth yang cocok akan highlight ungu

### Cari Jalur (A* Pathfinding):
1. Klik tab "🗺️ Cari Jalur"
2. Ketik ID booth asal dan tujuan (e.g. A01 → M32)
3. Atau klik booth pertama di peta → klik booth kedua
4. Klik "Cari" → muncul garis kuning beranimasi

### Zoom & Pan (Mobile):
- **2 jari pisah/rapatkan** → zoom in/out
- **1 jari geser** → pan/scroll peta
- **Scroll mouse** → zoom (desktop)
- Tombol "Reset View" → kembali normal

---

## BAGIAN 9 — Struktur Database SQLite

File database: `data/comipara.db`

```sql
-- Semua user (admin, super_admin, user biasa)
CREATE TABLE users (
  id       TEXT PRIMARY KEY,         -- ID numerik, disimpan sebagai TEXT
  name     TEXT NOT NULL,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'user',
  booths   TEXT NOT NULL DEFAULT '[]',   -- JSON array, e.g. '["A01","A02"]'
  fandoms  TEXT NOT NULL DEFAULT '[]'    -- JSON array
);

-- Daftar fandom yang tersedia
CREATE TABLE fandoms (
  name TEXT PRIMARY KEY
);

-- Price list per user
CREATE TABLE prices (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item    TEXT NOT NULL,
  price   TEXT NOT NULL
);

-- Katalog gambar per user (metadata saja, file di public/uploads/)
CREATE TABLE catalog (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name    TEXT NOT NULL,
  url     TEXT NOT NULL
);

-- Lockout login per email
CREATE TABLE lockouts (
  email        TEXT PRIMARY KEY,
  attempts     INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER   -- timestamp ms, NULL = tidak dikunci
);
```

---

## BAGIAN 10 — Deploy ke VPS Ubuntu (Production)

> Panduan ini untuk VPS berbayar dengan Ubuntu 22.04 / 24.04.
> SQLite **cocok dipakai di VPS** karena file database persistent di disk server.

---

### Step A — Masuk ke VPS

Di komputer lokal, buka terminal:
```bash
ssh root@IP_VPS_KAMU
# contoh: ssh root@103.x.x.x
```

Ganti password default jika diminta, lalu lanjut.

---

### Step B — Update sistem & install tools dasar

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential
```

> `build-essential` wajib ada karena `better-sqlite3` perlu dikompilasi dari source saat `npm install`.

---

### Step C — Install Node.js (via NVM — cara terbaik)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verifikasi
node --version   # harus muncul v20.x.x atau lebih baru
npm --version
```

---

### Step D — Install PM2 (process manager)

PM2 menjaga app tetap jalan meski terminal ditutup, dan auto-restart kalau crash.

```bash
npm install -g pm2
```

---

### Step E — Install Nginx (reverse proxy)

Nginx meneruskan request dari port 80/443 ke Next.js di port 3000.

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

### Step F — Upload project ke VPS

**Pilihan 1 — via Git (direkomendasikan):**
```bash
cd /var/www
git clone https://github.com/USERNAME/REPO_NAME.git comipara6-map
cd comipara6-map
```

**Pilihan 2 — via SCP (upload langsung dari komputer lokal):**
```bash
# Jalankan di komputer lokal, BUKAN di VPS
scp -r /path/ke/comipara6-map root@IP_VPS:/var/www/comipara6-map
```

Kemudian di VPS:
```bash
cd /var/www/comipara6-map
```

---

### Step G — Install dependencies & build

```bash
npm install
npm run build
```

> `npm run build` menghasilkan folder `.next/` yang dioptimasi untuk production.

---

### Step H — Migrasi data (jika punya data JSON lama)

```bash
npm run migrate
```

Kalau fresh install (tidak ada data lama), skip langkah ini — database dibuat otomatis saat app pertama jalan.

---

### Step I — Jalankan dengan PM2

```bash
pm2 start npm --name "comipara6" -- start
pm2 save
pm2 startup
```

Perintah `pm2 startup` akan mencetak satu baris perintah — **copy dan jalankan** perintah itu agar PM2 auto-start saat VPS reboot.

Cek status:
```bash
pm2 status
pm2 logs comipara6   # lihat log real-time
```

---

### Step J — Konfigurasi Nginx

Buat file konfigurasi:
```bash
nano /etc/nginx/sites-available/comipara6
```

Isi dengan (ganti `DOMAIN_KAMU.com` dengan domain atau IP VPS):
```nginx
server {
    listen 80;
    server_name DOMAIN_KAMU.com www.DOMAIN_KAMU.com;

    # Limit upload size (sesuaikan kebutuhan katalog)
    client_max_body_size 20M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Sajikan file upload langsung dari Nginx (lebih efisien)
    location /uploads/ {
        alias /var/www/comipara6-map/public/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

Aktifkan konfigurasi:
```bash
ln -s /etc/nginx/sites-available/comipara6 /etc/nginx/sites-enabled/
nginx -t          # cek tidak ada error
systemctl reload nginx
```

Sekarang app bisa diakses di: **http://DOMAIN_KAMU.com**

---

### Step K — HTTPS dengan SSL gratis (Let's Encrypt)

> Butuh domain yang sudah diarahkan ke IP VPS (DNS sudah propagasi).

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d DOMAIN_KAMU.com -d www.DOMAIN_KAMU.com
```

Ikuti instruksi, masukkan email. Certbot otomatis update konfigurasi Nginx.

SSL akan diperbarui otomatis, tapi cek dengan:
```bash
certbot renew --dry-run
```

---

### Step L — Atur permission folder data & uploads

```bash
# Pastikan app bisa baca/tulis ke folder data dan uploads
chown -R www-data:www-data /var/www/comipara6-map/data
chown -R www-data:www-data /var/www/comipara6-map/public/uploads
chmod -R 755 /var/www/comipara6-map/data
chmod -R 755 /var/www/comipara6-map/public/uploads
```

Lalu restart PM2 sebagai user yang benar:
```bash
pm2 restart comipara6
```

---

### Step M — Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

### Ringkasan Perintah Harian di VPS

| Keperluan | Perintah |
|-----------|----------|
| Lihat status app | `pm2 status` |
| Lihat log | `pm2 logs comipara6` |
| Restart app | `pm2 restart comipara6` |
| Update dari Git | `cd /var/www/comipara6-map && git pull && npm install && npm run build && pm2 restart comipara6` |
| Backup database | `cp /var/www/comipara6-map/data/comipara.db ~/backup-$(date +%F).db` |
| Cek Nginx | `systemctl status nginx` |
| Reload Nginx | `systemctl reload nginx` |

---

### Struktur folder di VPS setelah deploy

```
/var/www/comipara6-map/
├── .next/              ← hasil build (jangan disentuh)
├── data/
│   └── comipara.db     ← database SQLite (JANGAN dihapus!)
├── public/
│   └── uploads/        ← file katalog yang diupload user
├── lib/
├── app/
└── ...
```

> 💡 **Backup rutin**: Cukup backup file `data/comipara.db` dan folder `public/uploads/`.
> Dua folder itu adalah seluruh data penting aplikasi.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Module not found` | Jalankan `npm install` |
| `Cannot find module 'better-sqlite3'` | Pastikan `build-essential` terinstall, lalu `npm install` ulang |
| Port 3000 bentrok | `pm2 delete comipara6`, lalu jalankan ulang |
| Nginx 502 Bad Gateway | App belum jalan, cek `pm2 status` dan `pm2 logs comipara6` |
| Nginx 413 Request Entity Too Large | Tambah `client_max_body_size 20M;` di config Nginx |
| Tailwind tidak jalan | Cek `tailwind.config.js` |
| Peta tidak muncul | Cek console browser (F12) |
| Login redirect loop | Clear localStorage browser |
| Animasi garis tidak ada | Pastikan `<style>` ada di FloorMap.jsx |
| Database corrupt | `cp comipara.db comipara.db.bak`, hapus yang asli, jalankan `npm run migrate` |
| Permission denied di `/data` | Jalankan `chown -R www-data:www-data /var/www/comipara6-map/data` |
