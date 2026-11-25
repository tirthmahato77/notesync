import express from 'express';
import { db } from '../config/firebase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const labelsRouter = express.Router();

router.use(authMiddleware);
labelsRouter.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const isArchivedQuery = req.query.archived === 'true';
    const isTrashedQuery = req.query.trashed === 'true';
    const labelQuery = req.query.label;

    const snapshot = await db.collection('notes').where('userId', '==', req.user.uid).get();
    let notes = [];

    snapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    if (isTrashedQuery) {
      notes = notes.filter((note) => note.isTrashed === true);
    } else if (isArchivedQuery) {
      notes = notes.filter((note) => note.isArchived === true && !note.isTrashed);
    } else {
      notes = notes.filter((note) => !note.isArchived && !note.isTrashed);
    }

    if (labelQuery) {
      notes = notes.filter((note) => Array.isArray(note.labels) && note.labels.includes(labelQuery));
    }

    notes.sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching notes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      id,
      title = '',
      content = '',
      type = 'note',
      checklist = [],
      color = 'default',
      labels = [],
      isPinned = false,
      isArchived = false,
      isTrashed = false,
    } = req.body;

    const now = new Date().toISOString();
    const noteData = {
      userId: req.user.uid,
      title: title || '',
      content: content || '',
      type: type || 'note',
      checklist: Array.isArray(checklist) ? checklist : [],
      color: color || 'default',
      labels: Array.isArray(labels) ? labels : [],
      isPinned: Boolean(isPinned),
      isArchived: Boolean(isArchived),
      isTrashed: Boolean(isTrashed),
      trashedAt: isTrashed ? now : null,
      createdAt: req.body.createdAt || now,
      updatedAt: now,
    };

    let targetId = id;
    if (targetId) {
      await db.collection('notes').doc(targetId).set(noteData, { merge: true });
    } else {
      const docRef = await db.collection('notes').add(noteData);
      targetId = docRef.id;
    }

    return res.status(201).json({ id: targetId, ...noteData });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error creating note' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const operations = Array.isArray(req.body) ? req.body : (req.body.operations || []);
    const synced = [];

    for (const op of operations) {
      const { action, noteId, data = {}, timestamp } = op;
      const now = timestamp || new Date().toISOString();
      const targetId = data.id || noteId;

      if (!targetId) continue;

      if (action === 'create' || action === 'update') {
        const docRef = db.collection('notes').doc(targetId);
        const doc = await docRef.get();

        if (doc.exists) {
          if (doc.data().userId === req.user.uid) {
            const updates = { ...data };
            delete updates.id;
            delete updates.userId;
            delete updates.createdAt;
            updates.updatedAt = data.updatedAt || now;
            await docRef.update(updates);
          }
        } else {
          const noteData = {
            userId: req.user.uid,
            title: data.title || '',
            content: data.content || '',
            type: data.type || 'note',
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
            color: data.color || 'default',
            labels: Array.isArray(data.labels) ? data.labels : [],
            isPinned: Boolean(data.isPinned),
            isArchived: Boolean(data.isArchived),
            isTrashed: Boolean(data.isTrashed),
            trashedAt: data.isTrashed ? (data.trashedAt || now) : null,
            createdAt: data.createdAt || now,
            updatedAt: data.updatedAt || now,
          };
          await docRef.set(noteData);
        }
        synced.push({ noteId, serverId: targetId });
      } else if (action === 'delete') {
        const docRef = db.collection('notes').doc(targetId);
        const doc = await docRef.get();
        if (doc.exists && doc.data().userId === req.user.uid) {
          await docRef.delete();
        }
        synced.push({ noteId, serverId: targetId });
      }
    }

    return res.json({ synced });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error syncing notes' });
  }
});

const getLabels = async (req, res) => {
  try {
    const snapshot = await db.collection('labels').where('userId', '==', req.user.uid).get();
    const labels = [];
    snapshot.forEach((doc) => {
      labels.push({ id: doc.id, ...doc.data() });
    });
    return res.json(labels);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching labels' });
  }
};

const createLabel = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Label name is required' });
    }

    const labelData = {
      userId: req.user.uid,
      name: name.trim(),
    };

    const docRef = await db.collection('labels').add(labelData);
    return res.status(201).json({ id: docRef.id, ...labelData });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error creating label' });
  }
};

const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('labels').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Label not found' });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized access to label' });
    }

    await docRef.delete();
    return res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting label' });
  }
};

router.get('/labels', getLabels);
router.post('/labels', createLabel);
router.delete('/labels/:id', deleteLabel);

labelsRouter.get('/', getLabels);
labelsRouter.post('/', createLabel);
labelsRouter.delete('/:id', deleteLabel);

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('notes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = doc.data();
    if (note.userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized access to note' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    updates.updatedAt = new Date().toISOString();

    if (updates.isTrashed === true && !note.isTrashed) {
      updates.trashedAt = updates.updatedAt;
    } else if (updates.isTrashed === false) {
      updates.trashedAt = null;
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('notes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized access to note' });
    }

    await docRef.delete();
    return res.json({ message: 'Note deleted permanently' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting note' });
  }
});

export { labelsRouter };
export default router;
