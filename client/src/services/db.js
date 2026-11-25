import { openDB } from 'idb';

const DB_NAME = 'notesync-db';
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('userId', 'userId');
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('labels')) {
        db.createObjectStore('labels', { keyPath: 'id' });
      }
    },
  });
}

export async function saveNotesToLocal(notes) {
  const db = await initDB();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  await store.clear();
  for (const note of notes) {
    await store.put(note);
  }
  await tx.done;
}

export async function getLocalNotes() {
  const db = await initDB();
  return db.getAll('notes');
}

export async function saveNoteLocally(note) {
  const db = await initDB();
  await db.put('notes', note);
}

export async function deleteNoteLocally(id) {
  const db = await initDB();
  await db.delete('notes', id);
}

export async function addToSyncQueue(operation) {
  const db = await initDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const all = await store.getAll();

  const existing = all.find((item) => item.noteId === operation.noteId);
  if (existing) {
    const updatedAction =
      existing.action === 'create' && operation.action === 'update'
        ? 'create'
        : operation.action;

    await store.put({
      ...existing,
      action: updatedAction,
      data: { ...(existing.data || {}), ...(operation.data || {}) },
      timestamp: new Date().toISOString(),
    });
  } else {
    await store.add({
      ...operation,
      timestamp: new Date().toISOString(),
    });
  }
  await tx.done;
}

export async function getSyncQueue() {
  const db = await initDB();
  return db.getAll('syncQueue');
}

export async function clearSyncQueue() {
  const db = await initDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  await tx.objectStore('syncQueue').clear();
  await tx.done;
}

export async function removeSyncQueueItem(id) {
  const db = await initDB();
  await db.delete('syncQueue', id);
}

export async function saveLabelsToLocal(labels) {
  const db = await initDB();
  const tx = db.transaction('labels', 'readwrite');
  const store = tx.objectStore('labels');
  await store.clear();
  for (const label of labels) {
    await store.put(label);
  }
  await tx.done;
}

export async function getLocalLabels() {
  const db = await initDB();
  return db.getAll('labels');
}
