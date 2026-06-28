/**
 * Storage Adapter Router
 * ──────────────────────
 * Selects the right storage backend for a given user.
 *
 * Providers:
 *   "taskstack" — TaskStack's own MongoDB (default, no config needed)
 *   "mongodb"   — User's own MongoDB URI
 *   "supabase"  — User's own Supabase project (URL + key)
 *   "sqlite"    — Local SQLite file path
 *   "drive"     — Google Drive (Coming Soon)
 *   "dropbox"   — Dropbox (Coming Soon)
 *
 * Config is stored in the `users` collection in TaskStack's MongoDB
 * (we always need Mongo for auth/workspace data regardless of user's storage choice).
 */

import type { StorageAdapter, StorageDocument } from "./types";
import { getDatabase } from "@/lib/db/database";
import {
  listDocuments, getDocumentById,
  createDocument, updateDocument, deleteDocument,
} from "@/lib/db/database";

// ── Types ──────────────────────────────────────────────────────────────────

export type StorageProvider = "taskstack" | "mongodb" | "supabase" | "sqlite" | "drive" | "dropbox";

export interface StorageConfig {
  provider: StorageProvider;
  // MongoDB
  mongoUri?:   string;
  mongoDbName?: string;
  // Supabase
  supabaseUrl?: string;
  supabaseKey?: string;
  // SQLite
  sqlitePath?:  string;
  // Drive tokens (internal)
  driveAccessToken?:  string;
  driveRefreshToken?: string;
  driveTokenExpiresAt?: number;
}

// ── MongoDB shim (TaskStack's own DB) ──────────────────────────────────────

class MongoStorageAdapter implements StorageAdapter {
  async list(c: string, f?: Record<string, unknown>) {
    return (await listDocuments(c, f ?? {})) as StorageDocument[];
  }
  async get(c: string, id: string) {
    return (await getDocumentById(c, id)) as StorageDocument | null;
  }
  async create(c: string, data: Record<string, unknown>) {
    return (await createDocument(c, data)) as StorageDocument;
  }
  async update(c: string, id: string, data: Record<string, unknown>) {
    return (await updateDocument(c, id, data)) as StorageDocument;
  }
  async delete(c: string, id: string) {
    return deleteDocument(c, id);
  }
}

const defaultMongoAdapter = new MongoStorageAdapter();

// ── Config persistence ─────────────────────────────────────────────────────

/** Read storage config for a user from MongoDB. */
export async function getStorageConfig(userId: string): Promise<StorageConfig> {
  const db   = await getDatabase();
  const user = await db.collection("users").findOne(
    { $or: [{ userId }, { _id: userId as any }] },
    { projection: { storageConfig: 1 } },
  );
  return (user?.storageConfig as StorageConfig) ?? { provider: "taskstack" };
}

/** Save storage config for a user. */
export async function saveStorageConfig(userId: string, config: StorageConfig): Promise<void> {
  const db = await getDatabase();
  await db.collection("users").updateOne(
    { $or: [{ userId }, { _id: userId as any }] },
    { $set: { storageConfig: config, updatedAt: new Date() } },
  );
}

/** Remove storage config (reset to TaskStack default). */
export async function removeStorageConfig(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection("users").updateOne(
    { $or: [{ userId }, { _id: userId as any }] },
    { $unset: { storageConfig: "" }, $set: { updatedAt: new Date() } },
  );
}

// ── Legacy Drive token helpers (backwards compat) ─────────────────────────

export interface DriveTokens {
  accessToken:  string;
  refreshToken: string;
  expiresAt?:   number;
}

export async function getDriveTokens(userId: string): Promise<DriveTokens | null> {
  const config = await getStorageConfig(userId);
  if (config.provider !== "drive" || !config.driveAccessToken) return null;
  return {
    accessToken:  config.driveAccessToken,
    refreshToken: config.driveRefreshToken ?? "",
    expiresAt:    config.driveTokenExpiresAt,
  };
}

export async function saveDriveTokens(userId: string, tokens: DriveTokens): Promise<void> {
  await saveStorageConfig(userId, {
    provider:             "drive",
    driveAccessToken:     tokens.accessToken,
    driveRefreshToken:    tokens.refreshToken,
    driveTokenExpiresAt:  tokens.expiresAt,
  });
}

export async function removeDriveTokens(userId: string): Promise<void> {
  await removeStorageConfig(userId);
}

// ── Main adapter factory ───────────────────────────────────────────────────

/**
 * Returns the correct StorageAdapter for a user.
 * Falls back to TaskStack's MongoDB if no custom storage is configured.
 */
export async function getStorageAdapter(userId: string): Promise<StorageAdapter> {
  const config = await getStorageConfig(userId);

  switch (config.provider) {
    case "mongodb": {
      if (!config.mongoUri) return defaultMongoAdapter;
      const { MongoCustomAdapter } = await import("./MongoCustomAdapter");
      return new MongoCustomAdapter(config.mongoUri, config.mongoDbName ?? "taskstack");
    }

    case "supabase": {
      if (!config.supabaseUrl || !config.supabaseKey) return defaultMongoAdapter;
      const { SupabaseStorageAdapter } = await import("./SupabaseStorageAdapter");
      return new SupabaseStorageAdapter(config.supabaseUrl, config.supabaseKey);
    }

    case "sqlite": {
      if (!config.sqlitePath) return defaultMongoAdapter;
      const { SQLiteStorageAdapter } = await import("./SQLiteStorageAdapter");
      return new SQLiteStorageAdapter(config.sqlitePath);
    }

    case "drive": {
      if (!config.driveAccessToken) return defaultMongoAdapter;
      const { DriveStorageAdapter } = await import("./DriveStorageAdapter");
      return new DriveStorageAdapter(config.driveAccessToken, config.driveRefreshToken);
    }

    case "taskstack":
    default:
      return defaultMongoAdapter;
  }
}
