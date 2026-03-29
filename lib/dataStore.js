/**
 * Server-side data store menggunakan SQLite (better-sqlite3).
 * Drop-in replacement dari versi JSON sebelumnya.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "comipara.db");

// ─── Buka / buat database ──────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// WAL mode → lebih cepat untuk banyak pembaca, satu penulis
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Buat tabel jika belum ada ─────────────────────────────────────────────
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

// ─── Seed default users jika tabel kosong ─────────────────────────────────
const userCount = db.prepare("SELECT COUNT(*) as n FROM users").get().n;
if (userCount === 0) {
  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password, role, booths, fandoms) VALUES (?, ?, ?, ?, ?, '[]', '[]')",
  );
  insertUser.run("1", "Admin", "admin@comipara.com", "admin123", "admin");
  insertUser.run(
    "2",
    "SuperAdmin",
    "super@comipara.com",
    "super123",
    "super_admin",
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function rowToUser(row) {
  if (!row) return null;
  return {
    ...row,
    id: isNaN(Number(row.id)) ? row.id : Number(row.id),
    booths: JSON.parse(row.booths || "[]"),
    fandoms: JSON.parse(row.fandoms || "[]"),
  };
}

// ─── Users ─────────────────────────────────────────────────────────────────
export function getUsers() {
  return db.prepare("SELECT * FROM users").all().map(rowToUser);
}

export function saveUsers(users) {
  const upsert = db.prepare(`
    INSERT INTO users (id, name, email, password, role, booths, fandoms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name     = excluded.name,
      email    = excluded.email,
      password = excluded.password,
      role     = excluded.role,
      booths   = excluded.booths,
      fandoms  = excluded.fandoms
  `);

  // Hapus user yang tidak ada di list baru
  const existingIds = db
    .prepare("SELECT id FROM users")
    .all()
    .map((r) => r.id);
  const newIds = users.map((u) => String(u.id));
  const toDelete = existingIds.filter((id) => !newIds.includes(id));

  const run = db.transaction(() => {
    for (const u of users) {
      upsert.run(
        String(u.id),
        u.name,
        u.email,
        u.password,
        u.role || "user",
        JSON.stringify(u.booths || []),
        JSON.stringify(u.fandoms || []),
      );
    }
    for (const id of toDelete) {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    }
  });
  run();
}

// ─── Fandoms ───────────────────────────────────────────────────────────────
export function getFandoms() {
  return db
    .prepare("SELECT name FROM fandoms ORDER BY name")
    .all()
    .map((r) => r.name);
}

export function saveFandoms(fandoms) {
  const run = db.transaction(() => {
    db.prepare("DELETE FROM fandoms").run();
    const insert = db.prepare(
      "INSERT OR IGNORE INTO fandoms (name) VALUES (?)",
    );
    for (const name of fandoms) insert.run(name);
  });
  run();
}

// ─── Prices ────────────────────────────────────────────────────────────────
export function getPrices(userId) {
  return db
    .prepare("SELECT id, item, price FROM prices WHERE user_id = ?")
    .all(String(userId))
    .map((r) => ({ id: Number(r.id) || r.id, item: r.item, price: r.price }));
}

export function savePrices(userId, prices) {
  const run = db.transaction(() => {
    db.prepare("DELETE FROM prices WHERE user_id = ?").run(String(userId));
    const insert = db.prepare(
      "INSERT INTO prices (id, user_id, item, price) VALUES (?, ?, ?, ?)",
    );
    for (const p of prices) {
      insert.run(String(p.id), String(userId), p.item, String(p.price));
    }
  });
  run();
}

// ─── Catalog ──────────────────────────────────────────────────────────────
export function getCatalog(userId) {
  return db
    .prepare("SELECT id, name, url FROM catalog WHERE user_id = ?")
    .all(String(userId))
    .map((r) => ({ id: Number(r.id) || r.id, name: r.name, url: r.url }));
}

export function saveCatalog(userId, catalog) {
  const run = db.transaction(() => {
    db.prepare("DELETE FROM catalog WHERE user_id = ?").run(String(userId));
    const insert = db.prepare(
      "INSERT INTO catalog (id, user_id, name, url) VALUES (?, ?, ?, ?)",
    );
    for (const c of catalog) {
      insert.run(String(c.id), String(userId), c.name, c.url);
    }
  });
  run();
}

// ─── Uploads directory ────────────────────────────────────────────────────
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export function ensureUploadsDir(userId) {
  const dir = path.join(UPLOADS_DIR, String(userId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
