import { getNotes, syncNotes, getLabels } from './api.js';
import {
  getSyncQueue,
  clearSyncQueue,
  saveNotesToLocal,
  saveLabelsToLocal,
} from './db.js';

let isSyncing = false;

export async function syncWithServer() {
  if (isSyncing) {
    return { success: true, synced: 0 };
  }
  isSyncing = true;

  try {
    const queue = await getSyncQueue();

    if (queue.length > 0) {
      const operations = queue.map((item) => ({
        action: item.action,
        noteId: item.noteId,
        data: item.data,
        timestamp: item.timestamp,
      }));

      await syncNotes(operations);
      await clearSyncQueue();
    }

    const notes = await getNotes();
    await saveNotesToLocal(notes);

    try {
      const labels = await getLabels();
      await saveLabelsToLocal(labels);
    } catch (e) {
    }

    return { success: true, synced: queue.length };
  } catch (error) {
    return { success: false, synced: 0 };
  } finally {
    isSyncing = false;
  }
}

export function setupSyncListener() {
  window.addEventListener('online', () => {
    syncWithServer();
  });
}
