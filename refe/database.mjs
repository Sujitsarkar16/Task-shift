import { MongoClient, ObjectId } from 'mongodb';
import {
  buildInsertDocument,
  buildListQuery,
  buildUpdateDocument,
  getCollectionDefinition,
  getCollectionIndexes,
  getCollectionValidator,
  getSupportedCollections,
} from './schema.mjs';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.status = 500;
    throw error;
  }
  return value;
}

function getMongoUri() {
  return requireEnv('MONGODB_URI');
}

function getDatabaseName() {
  return requireEnv('MONGODB_DB_NAME');
}

function isAtlasUri(uri) {
  return uri.startsWith('mongodb+srv://');
}

function normalizeMongoUri(uri) {
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    return uri;
  }

  const scheme = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
  const remainder = uri.slice(scheme.length);
  const queryIndex = remainder.indexOf('?');
  const hostPart = queryIndex === -1 ? remainder : remainder.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? '' : remainder.slice(queryIndex + 1);
  const params = new URLSearchParams(queryPart);

  if (isAtlasUri(uri)) {
    if (!params.has('retryWrites')) params.set('retryWrites', 'true');
    if (!params.has('w')) params.set('w', 'majority');
  }

  const query = params.toString();
  return query ? `${scheme}${hostPart}?${query}` : `${scheme}${hostPart}`;
}

function getClientOptions(uri) {
  const options = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    // Avoid IPv6/IPv4 auto-selection issues on Windows + Node 17+.
    autoSelectFamily: false,
  };

  if (isAtlasUri(uri)) {
    options.serverApi = {
      version: '1',
      strict: false,
      deprecationErrors: true,
    };
  }

  return options;
}

function enrichConnectionError(error, uri) {
  const code = error?.cause?.code || error?.code;
  const isSslAlert = code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR'
    || String(error?.message || '').includes('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR');

  if (!isSslAlert || !isAtlasUri(uri)) {
    return error;
  }

  const helpful = new Error(
    'MongoDB Atlas connection failed during TLS handshake. '
    + 'In Atlas → Network Access, add your current IP (or 0.0.0.0/0 for development).',
  );
  helpful.status = 503;
  helpful.cause = error;
  return helpful;
}

let client;
let clientPromise;
let activeUri;

function resetClient() {
  client = undefined;
  clientPromise = undefined;
  activeUri = undefined;
}

async function connectToUri(uri) {
  const normalizedUri = normalizeMongoUri(uri);
  const nextClient = new MongoClient(normalizedUri, getClientOptions(normalizedUri));
  await nextClient.connect();
  await nextClient.db(getDatabaseName()).command({ ping: 1 });
  client = nextClient;
  activeUri = normalizedUri;
  return nextClient;
}

function getClient() {
  if (!clientPromise) {
    const uri = getMongoUri();

    if (process.env.LOG_DB_URI === '1') {
      console.log('[db] connecting to', uri.replace(/\/\/[^@]+@/, '//***:***@'));
    }

    clientPromise = connectToUri(uri).catch((error) => {
      resetClient();
      throw enrichConnectionError(error, uri);
    });
  }
  return clientPromise;
}

export async function getDatabase() {
  const connected = await getClient();
  return connected.db(getDatabaseName());
}

export async function closeDatabase() {
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error('[db] error closing connection:', error);
    } finally {
      client = undefined;
      clientPromise = undefined;
    }
  }
}

export function serializeDocument(document) {
  if (!document) {
    return null;
  }
  const { _id, ...rest } = document;
  return {
    id: _id?.toString?.() ?? String(_id),
    ...rest,
  };
}

function toObjectId(id) {
  if (typeof id !== 'string' || !ObjectId.isValid(id)) {
    const error = new Error('Invalid document id.');
    error.status = 400;
    throw error;
  }
  return new ObjectId(id);
}

async function ensureCollection(db, collectionName) {
  const existingCollections = await db.listCollections({ name: collectionName }).toArray();
  const validator = { $jsonSchema: getCollectionValidator(collectionName) };

  if (existingCollections.length === 0) {
    await db.createCollection(collectionName, {
      validator,
      validationAction: 'error',
      validationLevel: 'strict',
    });
  } else {
    await db.command({
      collMod: collectionName,
      validator,
      validationAction: 'error',
      validationLevel: 'strict',
    });
  }

  const indexes = getCollectionIndexes(collectionName);
  if (indexes.length > 0) {
    try {
      await db.collection(collectionName).createIndexes(indexes);
    } catch (error) {
      // Index spec changes can clash with existing ones; surface and continue.
      console.warn(`[db] index sync warning for ${collectionName}:`, error.message);
    }
  }
}

export async function ensureDatabaseSchema() {
  const db = await getDatabase();
  for (const collectionName of getSupportedCollections()) {
    await ensureCollection(db, collectionName);
  }
}

export async function listDocuments(collectionName, query) {
  const db = await getDatabase();
  const { filter, sort, limit } = buildListQuery(collectionName, query);
  const documents = await db
    .collection(collectionName)
    .find(filter)
    .sort(sort)
    .limit(limit)
    .toArray();

  return documents.map(serializeDocument);
}

export async function getDocumentById(collectionName, id) {
  const db = await getDatabase();
  const document = await db.collection(collectionName).findOne({ _id: toObjectId(id) });
  return document ? serializeDocument(document) : null;
}

export async function upsertUserProfileDocument(payload) {
  const db = await getDatabase();
  const now = new Date();
  const fields = getCollectionDefinition('users').normalizeCreate(payload);
  const existing = await db.collection('users').findOne({ userId: fields.userId });

  const set = { updatedAt: now };

  if (fields.email) {
    set.email = fields.email;
  }
  if (fields.photoURL) {
    set.photoURL = fields.photoURL;
  }
  if (fields.displayName && (!existing?.displayName || existing.displayName === fields.displayName)) {
    set.displayName = fields.displayName;
  }

  const setOnInsert = {
    userId: fields.userId,
    theme: fields.theme,
    reminderLeadDays: fields.reminderLeadDays,
    createdAt: now,
  };

  if (fields.defaultView) {
    setOnInsert.defaultView = fields.defaultView;
  }

  try {
    const result = await db.collection('users').findOneAndUpdate(
      { userId: fields.userId },
      { $set: set, $setOnInsert: setOnInsert },
      { upsert: true, returnDocument: 'after', includeResultMetadata: false },
    );

    if (!result) {
      const error = new Error('Failed to upsert user profile.');
      error.status = 500;
      throw error;
    }

    return serializeDocument(result);
  } catch (error) {
    if (error?.code === 11000) {
      const updated = await db.collection('users').findOneAndUpdate(
        { userId: fields.userId },
        { $set: set },
        { returnDocument: 'after', includeResultMetadata: false },
      );
      if (updated) {
        return serializeDocument(updated);
      }
    }
    throw error;
  }
}

export async function createDocument(collectionName, payload) {
  const db = await getDatabase();
  const document = buildInsertDocument(collectionName, payload);
  try {
    const result = await db.collection(collectionName).insertOne(document);
    return serializeDocument({ _id: result.insertedId, ...document });
  } catch (error) {
    if (error?.code === 121) {
      const validationError = new Error('Document failed MongoDB validation.');
      validationError.status = 400;
      throw validationError;
    }
    throw error;
  }
}

export async function updateDocument(collectionName, id, payload) {
  const db = await getDatabase();
  const update = buildUpdateDocument(collectionName, payload);
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: toObjectId(id) },
    update,
    { returnDocument: 'after', includeResultMetadata: false },
  );

  if (!result) {
    const error = new Error('Document not found.');
    error.status = 404;
    throw error;
  }

  return serializeDocument(result);
}

async function cascadeDeleteProject(db, projectId) {
  await Promise.all([
    db.collection('workItems').deleteMany({ projectId }),
    db.collection('testCases').deleteMany({ projectId }),
    db.collection('testSuites').deleteMany({ projectId }),
    db.collection('sprints').deleteMany({ projectId }),
    db.collection('projectMembers').deleteMany({ projectId }),
  ]);
}

export async function deleteDocument(collectionName, id) {
  const db = await getDatabase();
  const collection = db.collection(collectionName);
  const documentId = toObjectId(id);

  if (collectionName === 'projects') {
    const project = await collection.findOne({ _id: documentId });
    if (!project) {
      const error = new Error('Document not found.');
      error.status = 404;
      throw error;
    }
    await cascadeDeleteProject(db, id);
  }

  const result = await collection.deleteOne({ _id: documentId });
  if (result.deletedCount === 0) {
    const error = new Error('Document not found.');
    error.status = 404;
    throw error;
  }

  return { id };
}