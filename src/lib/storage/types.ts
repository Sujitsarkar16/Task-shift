/**
 * Storage adapter interface — MongoDB and Google Drive both implement this.
 * Every document has an `id` string, `createdAt` and `updatedAt` ISO strings,
 * plus arbitrary fields.
 */
export interface StorageDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ListOptions {
  filter?: Record<string, unknown>;
  sort?: string;        // field name
  order?: "asc" | "desc";
  limit?: number;
}

export interface StorageAdapter {
  /** List documents in a collection, optionally filtered. */
  list(collection: string, filter?: Record<string, unknown>): Promise<StorageDocument[]>;

  /** Get a single document by id. Returns null if not found. */
  get(collection: string, id: string): Promise<StorageDocument | null>;

  /** Create a document. Returns the created document with id assigned. */
  create(collection: string, data: Record<string, unknown>): Promise<StorageDocument>;

  /** Update a document. Returns the updated document. Throws 404 if not found. */
  update(collection: string, id: string, data: Record<string, unknown>): Promise<StorageDocument>;

  /** Delete a document. Throws 404 if not found. */
  delete(collection: string, id: string): Promise<{ id: string }>;
}
