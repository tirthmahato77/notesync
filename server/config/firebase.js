import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

let db;

const hasFirebaseCredentials =
  Boolean(process.env.FIREBASE_PROJECT_ID) &&
  Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
  Boolean(process.env.FIREBASE_PRIVATE_KEY);

if (hasFirebaseCredentials) {
  try {
    let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
    if (privateKey.endsWith(',')) {
      privateKey = privateKey.slice(0, -1).trim();
    }
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const app = getApps().length === 0 ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    }) : getApps()[0];

    db = getFirestore(app);
  } catch (err) {
    db = createFallbackStore();
  }
} else {
  db = createFallbackStore();
}

function createFallbackStore() {
  const store = {
    users: new Map(),
    notes: new Map(),
    labels: new Map(),
  };

  return {
    collection(name) {
      if (!store[name]) {
        store[name] = new Map();
      }
      const col = store[name];

      return {
        doc(id) {
          const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          return {
            id: docId,
            async get() {
              const data = col.get(docId);
              return {
                id: docId,
                exists: Boolean(data),
                data: () => data,
              };
            },
            async set(data) {
              col.set(docId, { ...data });
              return { id: docId };
            },
            async update(updates) {
              const existing = col.get(docId) || {};
              col.set(docId, { ...existing, ...updates });
              return { id: docId };
            },
            async delete() {
              col.delete(docId);
              return true;
            },
          };
        },
        async add(data) {
          const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          col.set(docId, { ...data });
          return { id: docId };
        },
        where(field, op, value) {
          return {
            limit(count) {
              return {
                async get() {
                  const docs = [];
                  for (const [id, item] of col.entries()) {
                    if (item[field] === value) {
                      docs.push({
                        id,
                        exists: true,
                        data: () => item,
                      });
                      if (docs.length >= count) break;
                    }
                  }
                  return {
                    empty: docs.length === 0,
                    docs,
                    forEach(cb) {
                      docs.forEach(cb);
                    },
                  };
                },
              };
            },
            async get() {
              const docs = [];
              for (const [id, item] of col.entries()) {
                if (item[field] === value) {
                  docs.push({
                    id,
                    exists: true,
                    data: () => item,
                  });
                }
              }
              return {
                empty: docs.length === 0,
                docs,
                forEach(cb) {
                  docs.forEach(cb);
                },
              };
            },
          };
        },
        async get() {
          const docs = [];
          for (const [id, item] of col.entries()) {
            docs.push({
              id,
              exists: true,
              data: () => item,
            });
          }
          return {
            empty: docs.length === 0,
            docs,
            forEach(cb) {
              docs.forEach(cb);
            },
          };
        },
      };
    },
  };
}

export { db };
export default db;
