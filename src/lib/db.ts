import Database from "better-sqlite3";
import path from "path";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(process.cwd(), "data", "eape.db");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  createTables(db);

  dbInstance = db;
  return db;
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      path TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usernames (
      username TEXT PRIMARY KEY,
      userId TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      wallet TEXT PRIMARY KEY,
      userId TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sol_wallets (
      solWallet TEXT PRIMARY KEY,
      userId TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_submissions (
      deviceId TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referral_events (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_logins (
      deviceId TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      lastLogin INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partnerships (
      id TEXT PRIMARY KEY,
      twitter TEXT,
      email TEXT,
      telegram TEXT,
      message TEXT,
      submittedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invest_early (
      id TEXT PRIMARY KEY,
      twitter TEXT,
      email TEXT,
      amount TEXT,
      message TEXT,
      submittedAt INTEGER NOT NULL
    );
  `);
}

export function configGet(path: string): unknown | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM config WHERE path = ?").get(path) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : null;
}

export function configSet(path: string, value: unknown): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO config (path, value) VALUES (?, ?)").run(path, JSON.stringify(value));
}

export function configDelete(path: string): void {
  const db = getDb();
  db.prepare("DELETE FROM config WHERE path = ?").run(path);
}

export function usersGetAll(): Record<string, unknown> {
  const db = getDb();
  const rows = db.prepare("SELECT id, data FROM users").all() as { id: string; data: string }[];
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.id] = JSON.parse(row.data);
  }
  return result;
}

export function userGet(id: string): unknown | null {
  const db = getDb();
  const row = db.prepare("SELECT data FROM users WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function userSet(id: string, data: unknown): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)").run(id, JSON.stringify(data));
}

export function userDelete(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function userUpdate(id: string, partial: Record<string, unknown>): unknown | null {
  const db = getDb();
  const existing = userGet(id) as Record<string, unknown> | null;
  if (!existing) return null;
  const updated = { ...existing, ...partial };
  userSet(id, updated);
  return updated;
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function claimGet(table: "usernames" | "wallets" | "sol_wallets", key: string): string | null {
  const db = getDb();
  const column = table === "usernames" ? "username" : table === "wallets" ? "wallet" : "solWallet";
  const row = db.prepare(`SELECT userId FROM ${table} WHERE ${column} = ?`).get(key) as { userId: string } | undefined;
  return row ? row.userId : null;
}

export function claimSet(table: "usernames" | "wallets" | "sol_wallets", key: string, userId: string): void {
  const db = getDb();
  const column = table === "usernames" ? "username" : table === "wallets" ? "wallet" : "solWallet";
  db.prepare(`INSERT OR REPLACE INTO ${table} (${column}, userId) VALUES (?, ?)`).run(key, userId);
}

export function deviceSubmissionGet(deviceId: string): Record<string, unknown> | null {
  const db = getDb();
  const row = db.prepare("SELECT data FROM device_submissions WHERE deviceId = ?").get(deviceId) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function deviceSubmissionSet(deviceId: string, data: unknown): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO device_submissions (deviceId, data) VALUES (?, ?)").run(deviceId, JSON.stringify(data));
}

export function deviceSubmissionUpdate(deviceId: string, partial: Record<string, unknown>): unknown {
  const db = getDb();
  const existing = deviceSubmissionGet(deviceId) || {};
  const updated = { ...existing, ...partial };
  deviceSubmissionSet(deviceId, updated);
  return updated;
}

export function referralEventSet(id: string, data: unknown): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO referral_events (id, data) VALUES (?, ?)").run(id, JSON.stringify(data));
}

export function deviceLoginGet(deviceId: string): { count: number; lastLogin: number } | null {
  const db = getDb();
  const row = db.prepare("SELECT count, lastLogin FROM device_logins WHERE deviceId = ?").get(deviceId) as { count: number; lastLogin: number } | undefined;
  return row || null;
}

export function deviceLoginSet(deviceId: string, count: number, lastLogin: number): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO device_logins (deviceId, count, lastLogin) VALUES (?, ?, ?)").run(deviceId, count, lastLogin);
}

export function deviceLoginsGetAll(): Record<string, { count: number; lastLogin: number }> {
  const db = getDb();
  const rows = db.prepare("SELECT deviceId, count, lastLogin FROM device_logins").all() as { deviceId: string; count: number; lastLogin: number }[];
  const result: Record<string, { count: number; lastLogin: number }> = {};
  for (const row of rows) {
    result[row.deviceId] = { count: row.count, lastLogin: row.lastLogin };
  }
  return result;
}

export function partnershipSubmit(data: { twitter: string; email: string; telegram: string; message: string }): string {
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO partnerships (id, twitter, email, telegram, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, data.twitter, data.email, data.telegram, data.message, Date.now());
  return id;
}

export function investEarlySubmit(data: { twitter: string; email: string; amount: string; message: string }): string {
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO invest_early (id, twitter, email, amount, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, data.twitter, data.email, data.amount, data.message, Date.now());
  return id;
}
