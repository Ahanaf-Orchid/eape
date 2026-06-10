/**
 * Firebase → SQLite Data Migration Script
 *
 * Usage: npx ts-node scripts/migrate-from-firebase.ts
 *
 * Requires:
 *   1. Firebase config in .env.local (NEXT_PUBLIC_FIREBASE_* vars)
 *   2. `npm install firebase` (if not already present from before)
 *   3. Existing SQLite DB at data/eape.db (will be auto-created if not)
 *
 * This script:
 *   - Connects to Firebase Realtime Database
 *   - Downloads all data from known paths
 *   - Transforms and inserts into SQLite tables
 *   - Verifies record counts
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import Database from "better-sqlite3";
import path from "path";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const DB_PATH = path.resolve(__dirname, "..", "data", "eape.db");

function getDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

async function fetchFirebase(path: string): Promise<Record<string, unknown> | null> {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const snapshot = await get(ref(database, path));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
}

async function migrate() {
  console.log("Starting Firebase → SQLite migration...\n");

  const db = getDb();

  console.log("1/8 Migrating config...");
  const configData = await fetchFirebase("config");
  if (configData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO config (path, value) VALUES (?, ?)");
    const insertConfig = db.transaction((data: Record<string, unknown>, prefix = "") => {
      for (const [key, value] of Object.entries(data)) {
        const fullPath = prefix ? `${prefix}/${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          stmt.run(fullPath, JSON.stringify(value));
          insertConfig(value as Record<string, unknown>, fullPath);
        } else {
          stmt.run(fullPath, JSON.stringify(value));
        }
      }
    });
    insertConfig(configData);
    console.log(`  ✓ ${Object.keys(configData).length} root config keys migrated`);
  }

  console.log("2/8 Migrating users...");
  const usersData = await fetchFirebase("users");
  if (usersData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)");
    const insertUsers = db.transaction(() => {
      for (const [id, data] of Object.entries(usersData)) {
        stmt.run(id, JSON.stringify(data));
      }
    });
    insertUsers();
    console.log(`  ✓ ${Object.keys(usersData).length} users migrated`);
  }

  console.log("3/8 Migrating usernames...");
  const usernamesData = await fetchFirebase("usernames");
  if (usernamesData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO usernames (username, userId) VALUES (?, ?)");
    const insert = db.transaction(() => {
      for (const [username, userId] of Object.entries(usernamesData)) {
        stmt.run(username, String(userId));
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(usernamesData).length} usernames migrated`);
  }

  console.log("4/8 Migrating wallets...");
  const walletsData = await fetchFirebase("wallets");
  if (walletsData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO wallets (wallet, userId) VALUES (?, ?)");
    const insert = db.transaction(() => {
      for (const [wallet, userId] of Object.entries(walletsData)) {
        stmt.run(wallet, String(userId));
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(walletsData).length} wallets migrated`);
  }

  console.log("5/8 Migrating sol_wallets...");
  const solWalletsData = await fetchFirebase("sol_wallets");
  if (solWalletsData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO sol_wallets (solWallet, userId) VALUES (?, ?)");
    const insert = db.transaction(() => {
      for (const [solWallet, userId] of Object.entries(solWalletsData)) {
        stmt.run(solWallet, String(userId));
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(solWalletsData).length} sol wallets migrated`);
  }

  console.log("6/8 Migrating device_submissions...");
  const deviceSubsData = await fetchFirebase("device_submissions");
  if (deviceSubsData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO device_submissions (deviceId, data) VALUES (?, ?)");
    const insert = db.transaction(() => {
      for (const [id, data] of Object.entries(deviceSubsData)) {
        stmt.run(id, JSON.stringify(data));
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(deviceSubsData).length} device submissions migrated`);
  }

  console.log("7/8 Migrating referral_events...");
  const referralData = await fetchFirebase("referralEvents");
  if (referralData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO referral_events (id, data) VALUES (?, ?)");
    const insert = db.transaction(() => {
      for (const [id, data] of Object.entries(referralData)) {
        stmt.run(id, JSON.stringify(data));
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(referralData).length} referral events migrated`);
  }

  console.log("8/8 Migrating device_logins...");
  const loginsData = await fetchFirebase("device_logins");
  if (loginsData) {
    const stmt = db.prepare("INSERT OR REPLACE INTO device_logins (deviceId, count, lastLogin) VALUES (?, ?, ?)");
    const insert = db.transaction(() => {
      for (const [deviceId, data] of Object.entries(loginsData)) {
        const loginData = data as { count: number; lastLogin: number };
        stmt.run(deviceId, loginData.count || 1, loginData.lastLogin || Date.now());
      }
    });
    insert();
    console.log(`  ✓ ${Object.keys(loginsData).length} device logins migrated`);
  }

  console.log("\nMigration complete!");
  console.log(`Database: ${DB_PATH}`);

  const tables = ["config", "users", "usernames", "wallets", "sol_wallets", "device_submissions", "referral_events", "device_logins"];
  console.log("\nRecord counts:");
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`  ${table}: ${row.count}`);
  }

  db.close();
}

migrate().catch(console.error);
