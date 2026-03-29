/**
 * Server-side login lockout — disimpan di SQLite (tabel lockouts).
 * Berdasarkan email, bukan IP (lebih akurat untuk multi-device).
 * Reset otomatis tiap ganti hari (tengah malam).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR   = path.join(process.cwd(), "data");
const DB_PATH    = path.join(DATA_DIR, "comipara.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Gunakan database yang sama dengan dataStore
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Pastikan tabel ada (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS lockouts (
    email        TEXT PRIMARY KEY,
    attempts     INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER
  );
`);

// Durasi kunci per tier
function getLockDuration(attempts) {
  if (attempts <= 3)  return 5  * 60 * 1000;        // 5 menit
  if (attempts <= 6)  return 30 * 60 * 1000;        // 30 menit
  if (attempts <= 9)  return 2  * 60 * 60 * 1000;   // 2 jam
  // 10+ → sampai tengah malam hari berikutnya
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - Date.now();
}

/**
 * Ambil status lockout untuk satu email.
 * @returns {{ attempts, lockedUntil, isLocked }}
 */
export function getLockout(email) {
  const key  = email.toLowerCase();
  const row  = db.prepare("SELECT attempts, locked_until FROM lockouts WHERE email = ?").get(key);
  const data = row || { attempts: 0, locked_until: null };
  return {
    attempts:    data.attempts,
    lockedUntil: data.locked_until,
    isLocked:    data.locked_until ? Date.now() < data.locked_until : false,
  };
}

/**
 * Catat satu percobaan salah untuk email ini.
 * @returns {{ attempts, lockedUntil, isLocked }}
 */
export function recordFailedAttempt(email) {
  const key     = email.toLowerCase();
  const current = db.prepare("SELECT attempts, locked_until FROM lockouts WHERE email = ?").get(key)
                  || { attempts: 0, locked_until: null };
  const attempts    = current.attempts + 1;
  const shouldLock  = attempts % 3 === 0;
  const lockedUntil = shouldLock
    ? Date.now() + getLockDuration(attempts)
    : current.locked_until;

  db.prepare(`
    INSERT INTO lockouts (email, attempts, locked_until) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      attempts     = excluded.attempts,
      locked_until = excluded.locked_until
  `).run(key, attempts, lockedUntil);

  return {
    attempts,
    lockedUntil,
    isLocked: lockedUntil ? Date.now() < lockedUntil : false,
  };
}

/**
 * Reset lockout setelah login berhasil.
 */
export function resetLockout(email) {
  db.prepare("DELETE FROM lockouts WHERE email = ?").run(email.toLowerCase());
}

/**
 * Bersihkan semua lockout yang sudah kedaluwarsa.
 * Dipanggil otomatis saat ada request login.
 */
export function cleanExpiredLockouts() {
  db.prepare("DELETE FROM lockouts WHERE locked_until IS NOT NULL AND locked_until <= ?")
    .run(Date.now());
}
