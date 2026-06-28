/**
 * Supabase Storage Adapter
 * ────────────────────────
 * Stores TaskStack data in the user's own Supabase project.
 * Uses a single `taskstack_data` table with a jsonb `data` column
 * so we don't need to create separate tables per collection.
 *
 * Table schema (created automatically on first use):
 *   CREATE TABLE taskstack_data (
 *     id         TEXT PRIMARY KEY,
 *     collection TEXT NOT NULL,
 *     data       JSONB NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 * The user provides:
 *   - Supabase Project URL  (e.g. https://xyz.supabase.co)
 *   - Supabase anon key     (safe to expose in client-side — RLS controls access)
 *   - OR service_role key   (server-side only, bypasses RLS)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter, StorageDocument } from "./types";

const TABLE = "taskstack_data";

function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function nowISO(): string { return new Date().toISOString(); }
function err404(): never {
  const e: any = new Error("Document not found."); e.status = 404; throw e;
}

/** Test a Supabase connection — returns { ok, error } */
export async function testSupabaseConnection(
  url: string, key: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createClient(url.trim(), key.trim());
    // Try a simple select — will error if table doesn't exist yet (that's fine)
    // We just want to confirm the URL + key are valid
    const { error } = await client.from(TABLE).select("id").limit(1);
    // PGRST116 = table does not exist yet — connection itself is fine
    if (error && error.code !== "PGRST116" && !error.message.includes("does not exist")) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Connection failed" };
  }
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url.trim(), key.trim());
  }

  /** Ensure the table exists — called lazily on first write. */
  private async ensureTable(): Promise<void> {
    // We use RPC to create the table if missing.
    // If the user's anon key doesn't have DDL rights, they need to
    // create the table manually — we'll surface a helpful error.
    const { error } = await this.client.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS ${TABLE} (
          id         TEXT PRIMARY KEY,
          collection TEXT NOT NULL,
          data       JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_${TABLE}_collection ON ${TABLE}(collection);
      `,
    });
    // Ignore — RPC might not exist, table might already exist
    void error;
  }

  async list(collection: string, filter?: Record<string, unknown>): Promise<StorageDocument[]> {
    let query = this.client
      .from(TABLE)
      .select("data")
      .eq("collection", collection)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST116" || error.message.includes("does not exist")) return [];
      throw new Error(`Supabase list error: ${error.message}`);
    }

    let docs = (data ?? []).map((row) => row.data as StorageDocument);

    // Apply filter in memory (same as Drive adapter)
    if (filter && Object.keys(filter).length > 0) {
      docs = docs.filter((doc) =>
        Object.entries(filter).every(([k, v]) => String(doc[k]) === String(v))
      );
    }
    return docs;
  }

  async get(collection: string, id: string): Promise<StorageDocument | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("data")
      .eq("collection", collection)
      .eq("id", id)
      .single();

    if (error) return null;
    return (data?.data as StorageDocument) ?? null;
  }

  async create(collection: string, payload: Record<string, unknown>): Promise<StorageDocument> {
    const now = nowISO();
    const doc: StorageDocument = { ...payload, id: (payload.id as string) ?? uuid(), createdAt: now, updatedAt: now };

    const { error } = await this.client.from(TABLE).insert({
      id: doc.id, collection, data: doc, created_at: now, updated_at: now,
    });

    if (error) {
      // Table missing — try to create it and retry once
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        await this.ensureTable();
        const retry = await this.client.from(TABLE).insert({
          id: doc.id, collection, data: doc, created_at: now, updated_at: now,
        });
        if (retry.error) throw new Error(`Supabase create error: ${retry.error.message}`);
        return doc;
      }
      throw new Error(`Supabase create error: ${error.message}`);
    }
    return doc;
  }

  async update(collection: string, id: string, payload: Record<string, unknown>): Promise<StorageDocument> {
    const existing = await this.get(collection, id);
    if (!existing) err404();

    const updated: StorageDocument = { ...existing, ...payload, id, updatedAt: nowISO() };
    const { error } = await this.client
      .from(TABLE)
      .update({ data: updated, updated_at: updated.updatedAt })
      .eq("collection", collection)
      .eq("id", id);

    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return updated;
  }

  async delete(collection: string, id: string): Promise<{ id: string }> {
    const { error, count } = await this.client
      .from(TABLE)
      .delete({ count: "exact" })
      .eq("collection", collection)
      .eq("id", id);

    if (error) throw new Error(`Supabase delete error: ${error.message}`);
    if (count === 0) err404();
    return { id };
  }
}
