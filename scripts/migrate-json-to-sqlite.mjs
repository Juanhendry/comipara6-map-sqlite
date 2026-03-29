/**
 * migrate-json-to-sqlite.mjs
 * ─────────────────────────────────────────────────────────────
 * Migrasi data lama (JSON) ke SQLite.
 * Jalankan SEKALI sebelum beralih ke versi SQLite:
 *
 *   node scripts/migrate-json-to-sqlite.mjs
 *
 * Script ini aman dijalankan berulang (idempotent via UPSERT).
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const DATA_DIR  = path.join(ROOT, "data");
const DB_PATH   = path.join(DATA_DIR, "comipara.db");

// ── Buka database ─────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Buat tabel ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT 'user',
    booths   TEXT NOT NULL DEFAULT '[]',
    fandoms  TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS fandoms (
    name TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS prices (
    id      TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item    TEXT NOT NULL,
    price   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS catalog (
    id      TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name    TEXT NOT NULL,
    url     TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lockouts (
    email        TEXT PRIMARY KEY,
    attempts     INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER
  );
`);

function readJSON(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

let migrated = 0;

// ── 1. Users ──────────────────────────────────────────────────────────────
const usersFile = path.join(DATA_DIR, "users.json");
const users     = readJSON(usersFile, []);
if (users.length > 0) {
  const upsert = db.prepare(`
    INSERT INTO users (id, name, email, password, role, booths, fandoms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, email=excluded.email, password=excluded.password,
      role=excluded.role, booths=excluded.booths, fandoms=excluded.fandoms
  `);
  const run = db.transaction(() => {
    for (const u of users) {
      upsert.run(
        String(u.id), u.name, u.email, u.password, u.role || "user",
        JSON.stringify(u.booths || []), JSON.stringify(u.fandoms || [])
      );
    }
  });
  run();
  console.log(`✅ Users      : ${users.length} baris`);
  migrated++;
} else {
  console.log("⏭️  Users      : tidak ada data (skip)");
}

// ── 2. Fandoms ────────────────────────────────────────────────────────────
const fandomsFile = path.join(DATA_DIR, "fandoms.json");
const fandoms     = readJSON(fandomsFile, []);
if (fandoms.length > 0) {
  const insert = db.prepare("INSERT OR IGNORE INTO fandoms (name) VALUES (?)");
  const run    = db.transaction(() => { for (const f of fandoms) insert.run(f); });
  run();
  console.log(`✅ Fandoms     : ${fandoms.length} baris`);
  migrated++;
} else {
  console.log("⏭️  Fandoms     : tidak ada data (skip)");
}

// ── 3. Prices (per-user JSON files di data/prices/) ───────────────────────
const pricesDir = path.join(DATA_DIR, "prices");
if (fs.existsSync(pricesDir)) {
  const files = fs.readdirSync(pricesDir).filter(f => f.endsWith(".json"));
  const insert = db.prepare(
    "INSERT OR IGNORE INTO prices (id, user_id, item, price) VALUES (?, ?, ?, ?)"
  );
  let total = 0;
  const run = db.transaction(() => {
    for (const file of files) {
      const userId = path.basename(file, ".json");
      const prices = readJSON(path.join(pricesDir, file), []);
      for (const p of prices) {
        insert.run(String(p.id), userId, p.item, String(p.price));
        total++;
      }
    }
  });
  run();
  console.log(`✅ Prices      : ${total} baris dari ${files.length} file`);
  migrated++;
} else {
  console.log("⏭️  Prices      : folder tidak ada (skip)");
}

// ── 4. Catalog (per-user JSON files di data/catalog/) ────────────────────
const catalogDir = path.join(DATA_DIR, "catalog");
if (fs.existsSync(catalogDir)) {
  const files  = fs.readdirSync(catalogDir).filter(f => f.endsWith(".json"));
  const insert = db.prepare(
    "INSERT OR IGNORE INTO catalog (id, user_id, name, url) VALUES (?, ?, ?, ?)"
  );
  let total = 0;
  const run = db.transaction(() => {
    for (const file of files) {
      const userId  = path.basename(file, ".json");
      const catalog = readJSON(path.join(catalogDir, file), []);
      for (const c of catalog) {
        insert.run(String(c.id), userId, c.name, c.url);
        total++;
      }
    }
  });
  run();
  console.log(`✅ Catalog     : ${total} baris dari ${files.length} file`);
  migrated++;
} else {
  console.log("⏭️  Catalog     : folder tidak ada (skip)");
}

// ── 5. Lockouts ───────────────────────────────────────────────────────────
const lockoutFile = path.join(DATA_DIR, "lockout.json");
const lockouts    = readJSON(lockoutFile, {});
const entries     = Object.entries(lockouts);
if (entries.length > 0) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO lockouts (email, attempts, locked_until) VALUES (?, ?, ?)
  `);
  const run = db.transaction(() => {
    for (const [email, val] of entries) {
      insert.run(email, val.attempts || 0, val.lockedUntil || null);
    }
  });
  run();
  console.log(`✅ Lockouts    : ${entries.length} baris`);
  migrated++;
} else {
  console.log("⏭️  Lockouts    : tidak ada data (skip)");
}

// ── Selesai ───────────────────────────────────────────────────────────────
console.log(`\n🎉 Migrasi selesai! ${migrated} tabel berhasil diisi.`);
console.log(`📦 Database    : ${DB_PATH}`);
db.close();
