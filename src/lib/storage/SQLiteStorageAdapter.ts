/**
 * SQLite Storage Adapter
 * ──────────────────────
 * Stores TaskStack data in a local SQLite database file.
 * Great for: self-hosted deployments, local development, offline-first setups.
 *
 * Uses better-sqlite3 (synchronous API, very fast).
 *
 * The user provides:
 *   - File path (absolute or relative to process.cwd())
 *     e.g. "/data/taskstack.db" or "./taskstack.db"
 *     Leave blank for in-memory (:memory:) — resets on server restart
 *
 * Schema (one table):
 *   CREATE TABLE taskstack_data (
 *     id         TEXT PRIMARY KEY,
 *     collection TEXT NOT NULL,
 *     data       TEXT NOT NULL,   -- JSON string
 *     created_at TEXT,
 *     updated_at TEXT
 *   );
 *
 * NOTE: better-sqlite3 requires a native build.
 * On Vercel (serverless) SQLite is ephemeral — the filesystem resets on each deploy.
 * This adapter is best for self-hosted or local Docker deployments.
 */

import type { StorageAdapter, StorageDocument } from "./types";

const TABLE = "taskstack_data";

function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function nowISO(): string { return new Date().toISOString(); }
function err404(): never {
  const e: any = new Error("Document not found."); e.status = 404; throw e;
}

// ── Lazy import — avoids build errors when better-sqlite3 is not available ─
let BetterSQLite: any = null;
async function getSQLite() {
  if (!BetterSQLite) {
    try {
      BetterSQLite = (await import("better-sqlite3")).default;
    } catch {
      throw new Error("better-sqlite3 is not installed. Run: npm install better-sqlite3");
    }
  }
  return BetterSQLite;
}

// DB instance cache — one per file path
const dbCache = new Map<string, any>();

async function getDb(filePath: string) {
  const key = filePath || ":memory:";
  if (dbCache.has(key)) return dbCache.get(key)!;

  const SQLite = await getSQLite();
  const db     = new SQLite(key);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id         TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      data       TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_collection ON ${TABLE}(collection);
  `);

  dbCache.set(key, db);
  return db;
}

/** Test a SQLite file path — returns { ok, error } */
export async function testSQLiteConnection(
  filePath: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = await getDb(filePath);
    db.prepare(`SELECT 1`).get();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Cannot open SQLite database" };
  }
}

export class SQLiteStorageAdapter implements StorageAdapter {
  constructor(private filePath: string) {}

  private async db() { return getDb(this.filePath); }

  async list(collection: string, filter?: Record<string, unknown>): Promise<StorageDocument[]> {
    const db = await this.db();
    const rows: any[] = db
      .prepare(`SELECT data FROM ${TABLE} WHERE collection = ? ORDER BY created_at DESC LIMIT 300`)
      .all(collection);

    let docs = rows.map((r) => JSON.parse(r.data) as StorageDocument);

    if (filter && Object.keys(filter).length > 0) {
      docs = docs.filter((doc) =>
        Object.entries(filter).every(([k, v]) => String(doc[k]) === String(v))
      );
    }
    return docs;
  }

  async get(collection: string, id: string): Promise<StorageDocument | null> {
    const db  = await this.db();
    const row: any = db
      .prepare(`SELECT data FROM ${TABLE} WHERE collection = ? AND id = ?`)
      .get(collection, id);
    return row ? JSON.parse(row.data) as StorageDocument : null;
  }

  async create(collection: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const db  = await this.db();
    const now = nowISO();
    const doc: StorageDocument = { ...data, id: (data.id as string) ?? uuid(), createdAt: now, updatedAt: now };
    db.prepare(`
      INSERT INTO ${TABLE} (id, collection, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(doc.id, collection, JSON.stringify(doc), now, now);
    return doc;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const existing = await this.get(collection, id);
    if (!existing) err404();

    const db      = await this.db();
    const updated: StorageDocument = { ...existing, ...data, id, updatedAt: nowISO() };
    const res: any = db.prepare(`
      UPDATE ${TABLE} SET data = ?, updated_at = ? WHERE collection = ? AND id = ?
    `).run(JSON.stringify(updated), updated.updatedAt, collection, id);

    if (res.changes === 0) err404();
    return updated;
  }

  async delete(collection: string, id: string): Promise<{ id: string }> {
    const db  = await this.db();
    const res: any = db
      .prepare(`DELETE FROM ${TABLE} WHERE collection = ? AND id = ?`)
      .run(collection, id);
    if (res.changes === 0) err404();
    return { id };
  }
}
