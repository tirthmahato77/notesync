import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineCheckBadge,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import ChecklistEditor from '../components/ChecklistEditor';
import LabelManager from '../components/LabelManager';
import OnlineStatus from '../components/OnlineStatus';

import * as api from '../services/api';
import * as db from '../services/db';
import { syncWithServer, setupSyncListener } from '../services/sync';

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editingNote, setEditingNote] = useState(null);
  const [editorType, setEditorType] = useState(null);
  const [showLabelManager, setShowLabelManager] = useState(false);

  useEffect(() => {
    loadData();

    const handleOnline = async () => {
      const res = await syncWithServer();
      if (res.success && res.synced > 0) {
        toast.success(`Synchronized ${res.synced} offline change(s)`);
        loadData();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadData = async () => {
    try {
      const [localNotes, localLabels] = await Promise.all([
        db.getLocalNotes(),
        db.getLocalLabels(),
      ]);
      setNotes(localNotes);
      setLabels(localLabels);
      setLoading(false);

      if (navigator.onLine) {
        try {
          await syncWithServer();
          const [remoteNotes, remoteLabels] = await Promise.all([
            api.getNotes(),
            api.getLabels(),
          ]);

          setNotes(remoteNotes);
          setLabels(remoteLabels);

          await db.saveNotesToLocal(remoteNotes);
          await db.saveLabelsToLocal(remoteLabels);
        } catch {
        }
      }
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setEditorType('note');
  };

  const handleOpenNewChecklist = () => {
    setEditingNote(null);
    setEditorType('checklist');
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setEditorType(note.type === 'checklist' ? 'checklist' : 'note');
  };

  const handleCloseEditor = () => {
    setEditingNote(null);
    setEditorType(null);
  };

  const handleSaveNote = async (noteData, isAutoSave = false) => {
    const noteId = noteData.id;
    const isNew = !notes.some((n) => n.id === noteId);
    const noteToSave = {
      ...noteData,
      id: noteId,
      updatedAt: new Date().toISOString(),
      createdAt: noteData.createdAt || new Date().toISOString(),
      isArchived: Boolean(noteData.isArchived),
      isTrashed: false,
    };

    setNotes((prevNotes) => {
      const exists = prevNotes.some((n) => n.id === noteId);
      if (exists) {
        return prevNotes.map((n) => (n.id === noteId ? noteToSave : n));
      } else {
        return [noteToSave, ...prevNotes];
      }
    });

    await db.saveNoteLocally(noteToSave);

    if (navigator.onLine) {
      try {
        const saved = await api.createNote(noteToSave);
        await db.saveNoteLocally(saved);
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? saved : n))
        );
      } catch (err) {
        await db.addToSyncQueue({
          action: isNew ? 'create' : 'update',
          noteId: noteId,
          data: noteToSave,
        });
      }
    } else {
      await db.addToSyncQueue({
        action: isNew ? 'create' : 'update',
        noteId: noteId,
        data: noteToSave,
      });
      if (!isAutoSave) {
        toast('Saved offline. Will sync when back online.', { icon: '💾' });
      }
    }
  };

  const handleTogglePin = async (note) => {
    const updated = {
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    await db.saveNoteLocally(updated);

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, { isPinned: updated.isPinned });
      } catch (e) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { isPinned: updated.isPinned },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { isPinned: updated.isPinned },
      });
    }
  };

  const handleToggleArchive = async (note) => {
    const updated = {
      ...note,
      isArchived: true,
      isPinned: false,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await db.saveNoteLocally(updated);
    toast.success('Note archived');

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, {
          isArchived: true,
          isPinned: false,
        });
      } catch (e) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { isArchived: true, isPinned: false },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { isArchived: true, isPinned: false },
      });
    }
  };

  const handleDeleteNote = async (note) => {
    const updated = {
      ...note,
      isTrashed: true,
      trashedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await db.saveNoteLocally(updated);
    toast('Moved to Trash', { icon: '🗑️' });

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, {
          isTrashed: true,
          trashedAt: updated.trashedAt,
        });
      } catch (e) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { isTrashed: true, trashedAt: updated.trashedAt },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { isTrashed: true, trashedAt: updated.trashedAt },
      });
    }
  };

  const handleChangeColor = async (note, newColor) => {
    const updated = {
      ...note,
      color: newColor,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    await db.saveNoteLocally(updated);

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, { color: newColor });
      } catch (e) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { color: newColor },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { color: newColor },
      });
    }
  };

  const handleCreateLabel = async (name) => {
    const tempId = `lbl_${Date.now()}`;
    const newLbl = { id: tempId, name };

    setLabels((prev) => [...prev, newLbl]);
    await db.saveLabelsToLocal([...labels, newLbl]);

    if (navigator.onLine) {
      try {
        const created = await api.createLabel(name);
        setLabels((prev) =>
          prev.map((l) => (l.id === tempId ? created : l))
        );
        const updatedLabels = labels.map((l) =>
          l.id === tempId ? created : l
        );
        await db.saveLabelsToLocal(updatedLabels);
      } catch (e) {
        toast.error('Failed to save label online');
      }
    }
  };

  const handleDeleteLabel = async (id) => {
    const remaining = labels.filter((l) => l.id !== id);
    setLabels(remaining);
    await db.saveLabelsToLocal(remaining);

    if (navigator.onLine) {
      try {
        await api.deleteLabel(id);
      } catch (e) {
        toast.error('Failed to delete label online');
      }
    }
  };

  const activeNotes = notes.filter((n) => !n.isArchived && !n.isTrashed);

  const filteredNotes = activeNotes.filter((note) => {
    const matchesSearch =
      (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(note.checklist) &&
        note.checklist.some((item) =>
          item.text.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesLabel = selectedLabel
      ? Array.isArray(note.labels) && note.labels.includes(selectedLabel)
      : true;

    return matchesSearch && matchesLabel;
  });

  const pinnedNotes = filteredNotes.filter((n) => Boolean(n.isPinned));
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <OnlineStatus />

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          labels={labels}
          selectedLabel={selectedLabel}
          onSelectLabel={setSelectedLabel}
          onManageLabels={() => setShowLabelManager(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {selectedLabel && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    <span>Label: {selectedLabel}</span>
                    <button
                      onClick={() => setSelectedLabel(null)}
                      className="hover:text-amber-950 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleOpenNewChecklist}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-sm font-medium shadow-xs flex items-center gap-2 transition-all"
                >
                  <HiOutlineCheckBadge className="w-4 h-4 text-amber-500" />
                  <span>New Checklist</span>
                </button>
                <button
                  onClick={handleOpenNewNote}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium shadow-xs flex items-center gap-2 transition-all"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>Take a Note</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 bg-white/60 border border-stone-200/60 rounded-2xl p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                  <HiOutlineDocumentText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  {searchQuery || selectedLabel
                    ? 'No matching notes found'
                    : 'Notes you add appear here'}
                </h3>
                <p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedLabel
                    ? 'Try adjusting your search query or selected label filter'
                    : 'Create your first note or checklist to keep track of thoughts and tasks'}
                </p>
                {!searchQuery && !selectedLabel && (
                  <button
                    onClick={handleOpenNewNote}
                    className="mt-5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Create Note
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {pinnedNotes.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">
                      Pinned
                    </h2>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                          : 'space-y-3'
                      }
                    >
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={handleOpenEdit}
                          onDelete={handleDeleteNote}
                          onTogglePin={handleTogglePin}
                          onToggleArchive={handleToggleArchive}
                          onChangeColor={handleChangeColor}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {otherNotes.length > 0 && (
                  <section>
                    {pinnedNotes.length > 0 && (
                      <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">
                        Others
                      </h2>
                    )}
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                          : 'space-y-3'
                      }
                    >
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={handleOpenEdit}
                          onDelete={handleDeleteNote}
                          onTogglePin={handleTogglePin}
                          onToggleArchive={handleToggleArchive}
                          onChangeColor={handleChangeColor}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {editorType === 'note' && (
        <NoteEditor
          note={editingNote}
          labels={labels}
          onSave={handleSaveNote}
          onClose={handleCloseEditor}
        />
      )}

      {editorType === 'checklist' && (
        <ChecklistEditor
          note={editingNote}
          labels={labels}
          onSave={handleSaveNote}
          onClose={handleCloseEditor}
        />
      )}

      {showLabelManager && (
        <LabelManager
          labels={labels}
          onCreateLabel={handleCreateLabel}
          onDeleteLabel={handleDeleteLabel}
          onClose={() => setShowLabelManager(false)}
        />
      )}
    </div>
  );
}

