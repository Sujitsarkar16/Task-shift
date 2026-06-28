/**
 * Custom MongoDB Storage Adapter
 * ──────────────────────────────
 * Connects to the user's own MongoDB instance (Atlas, self-hosted, CosmosDB, etc.)
 * using a connection string they provide.
 *
 * The user provides:
 *   - MongoDB connection URI (e.g. mongodb+srv://user:pass@cluster.mongodb.net/mydb)
 *   - Optional: database name (defaults to "taskstack")
 *
 * Data is stored in the same collection names as TaskStack uses (todos, habits, etc.)
 * Each document gets an `id` field (string version of _id).
 */

import { MongoClient, ObjectId } from "mongodb";
import type { StorageAdapter, StorageDocument } from "./types";

function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function nowISO(): string { return new Date().toISOString(); }
function err404(): never {
  const e: any = new Error("Document not found."); e.status = 404; throw e;
}

/** Test a MongoDB connection URI — returns { ok, error } */
export async function testMongoConnection(
  uri: string, dbName = "taskstack",
): Promise<{ ok: boolean; error?: string }> {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(uri.trim(), { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Connection failed" };
  } finally {
    await client?.close().catch(() => {});
  }
}

// Per-user connection cache — avoids reconnecting on every request
const connectionCache = new Map<string, { client: MongoClient; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getClient(uri: string): Promise<MongoClient> {
  const key = uri;
  const cached = connectionCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.client;

  const client = new MongoClient(uri.trim(), { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  connectionCache.set(key, { client, ts: Date.now() });
  return client;
}

export class MongoCustomAdapter implements StorageAdapter {
  constructor(private uri: string, private dbName = "taskstack") {}

  private async db() {
    const client = await getClient(this.uri);
    return client.db(this.dbName);
  }

  async list(collection: string, filter?: Record<string, unknown>): Promise<StorageDocument[]> {
    const db   = await this.db();
    const docs = await db.collection(collection)
      .find(filter ?? {})
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    return docs.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id.toString(),
      createdAt: rest.createdAt instanceof Date ? rest.createdAt.toISOString() : (rest.createdAt as string ?? nowISO()),
      updatedAt: rest.updatedAt instanceof Date ? rest.updatedAt.toISOString() : (rest.updatedAt as string ?? nowISO()),
    })) as StorageDocument[];
  }

  async get(collection: string, id: string): Promise<StorageDocument | null> {
    const db  = await this.db();
    // Try by string id field first, then by _id
    let doc = await db.collection(collection).findOne({ id });
    if (!doc && ObjectId.isValid(id)) {
      doc = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    }
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString(),
      createdAt: rest.createdAt instanceof Date ? rest.createdAt.toISOString() : (rest.createdAt as string ?? nowISO()),
      updatedAt: rest.updatedAt instanceof Date ? rest.updatedAt.toISOString() : (rest.updatedAt as string ?? nowISO()),
    } as StorageDocument;
  }

  async create(collection: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const db  = await this.db();
    const now = new Date();
    const doc = { ...data, id: data.id ?? uuid(), createdAt: now, updatedAt: now };
    const res = await db.collection(collection).insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() } as StorageDocument;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const db      = await this.db();
    const now     = new Date();
    // Try by string id field
    let result = await db.collection(collection).findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: now } },
      { returnDocument: "after" },
    );
    if (!result && ObjectId.isValid(id)) {
      result = await db.collection(collection).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: now } },
        { returnDocument: "after" },
      );
    }
    if (!result) err404();
    const { _id, ...rest } = result!;
    return {
      ...rest, id: _id.toString(),
      createdAt: rest.createdAt instanceof Date ? rest.createdAt.toISOString() : (rest.createdAt as string),
      updatedAt: now.toISOString(),
    } as StorageDocument;
  }

  async delete(collection: string, id: string): Promise<{ id: string }> {
    const db = await this.db();
    let res  = await db.collection(collection).deleteOne({ id });
    if (res.deletedCount === 0 && ObjectId.isValid(id)) {
      res = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    }
    if (res.deletedCount === 0) err404();
    return { id };
  }
}
