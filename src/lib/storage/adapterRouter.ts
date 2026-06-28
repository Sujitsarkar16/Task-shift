/**
 * Storage adapter router
 * ──────────────────────
 * Returns a DriveStorageAdapter if the user has connected Google Drive,
 * otherwise falls back to the MongoDB adapter (the existing database.js).
 *
 * The user's Drive tokens are stored in MongoDB (our user collection) because:
 * - MongoDB is always available (the app needs it for auth + workspace data)
 * - We only store Drive tokens in Mongo, NOT the user's actual data
 * - User data goes directly to their Drive if connected
 */

import { DriveStorageAdapter } from "./DriveStorageAdapter";
import type { StorageAdapter, StorageDocument } from "./types";
import { getDatabase } from "@/lib/db/database";

// ── In-memory adapter cache (per-request-reuse, not cross-request) ─────────
// Each server-side request creates fresh adapters; the cache just avoids
// recreating the same adapter multiple times within one request.
const adapterCache = new WeakMap<object, StorageAdapter>();
const requestKey   = {};   // replaced by a per-request context in the wrapper

// ── Token storage helpers ──────────────────────────────────────────────────

export interface DriveTokens {
  accessToken:  string;
  refreshToken: string;
  expiresAt?:   number;   // Unix ms
}

/** Read stored Drive tokens for a user from MongoDB. */
export async function getDriveTokens(userId: string): Promise<DriveTokens | null> {
  const db   = await getDatabase();
  const user = await db.collection("users").findOne(
    { $or: [{ userId }, { _id: userId as any }] },
    { projection: { driveAccessToken: 1, driveRefreshToken: 1, driveTokenExpiresAt: 1 } },
  );
  if (!user?.driveAccessToken) return null;
  return {
    accessToken:  user.driveAccessToken,
    refreshToken: user.driveRefreshToken,
    expiresAt:    user.driveTokenExpiresAt,
  };
}

/** Persist Drive tokens for a user to MongoDB. */
export async function saveDriveTokens(userId: string, tokens: DriveTokens): Promise<void> {
  const db = await getDatabase();
  await db.collection("users").updateOne(
    { $or: [{ userId }, { _id: userId as any }] },
    {
      $set: {
        driveAccessToken:    tokens.accessToken,
        driveRefreshToken:   tokens.refreshToken,
        driveTokenExpiresAt: tokens.expiresAt,
        driveConnectedAt:    new Date(),
        updatedAt:           new Date(),
      },
    },
  );
}

/** Remove Drive tokens — disconnects Drive for a user. */
export async function removeDriveTokens(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection("users").updateOne(
    { $or: [{ userId }, { _id: userId as any }] },
    {
      $unset: {
        driveAccessToken:    "",
        driveRefreshToken:   "",
        driveTokenExpiresAt: "",
        driveConnectedAt:    "",
      },
      $set: { updatedAt: new Date() },
    },
  );
}

/** Check if a user has Drive connected. */
export async function isDriveConnected(userId: string): Promise<boolean> {
  const tokens = await getDriveTokens(userId);
  return tokens !== null;
}

// ── MongoDB shim adapter ───────────────────────────────────────────────────
// Wraps the existing database.js functions so they conform to StorageAdapter.

import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/db/database";

class MongoStorageAdapter implements StorageAdapter {
  async list(collection: string, filter?: Record<string, unknown>): Promise<StorageDocument[]> {
    const docs = await listDocuments(collection, filter ?? {});
    return docs as StorageDocument[];
  }

  async get(collection: string, id: string): Promise<StorageDocument | null> {
    const doc = await getDocumentById(collection, id);
    return doc as StorageDocument | null;
  }

  async create(collection: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const doc = await createDocument(collection, data);
    return doc as StorageDocument;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<StorageDocument> {
    const doc = await updateDocument(collection, id, data);
    return doc as StorageDocument;
  }

  async delete(collection: string, id: string): Promise<{ id: string }> {
    return deleteDocument(collection, id);
  }
}

// Singleton MongoDB adapter
const mongoAdapter = new MongoStorageAdapter();

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the correct StorageAdapter for a given userId.
 * - If Drive is connected: DriveStorageAdapter (user's own Google Drive)
 * - Otherwise: MongoStorageAdapter (TaskStack's MongoDB)
 */
export async function getStorageAdapter(userId: string): Promise<StorageAdapter> {
  const tokens = await getDriveTokens(userId);
  if (!tokens) return mongoAdapter;
  return new DriveStorageAdapter(tokens.accessToken, tokens.refreshToken);
}
