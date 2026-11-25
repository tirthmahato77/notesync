import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlineArchiveBox, HiOutlineDocumentText } from 'react-icons/hi2';

import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import NoteCard from '../components/NoteCard';
import LabelManager from '../components/LabelManager';
import OnlineStatus from '../components/OnlineStatus';

import * as api from '../services/api';
import * as db from '../services/db';

export default function Archive() {
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [localNotes, localLabels] = await Promise.all([
        db.getLocalNotes(),
        db.getLocalLabels(),
      ]);
      setNotes(localNotes.filter((n) => n.isArchived && !n.isTrashed));
      setLabels(localLabels);
      setLoading(false);

      if (navigator.onLine) {
        try {
          const [remoteNotes, remoteLabels] = await Promise.all([
            api.getNotes({ archived: true }),
            api.getLabels(),
          ]);
          setNotes(remoteNotes);
          setLabels(remoteLabels);
        } catch {
        }
      }
    } catch {
      toast.error('Failed to load archived notes');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (note) => {
    const updated = {
      ...note,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await db.saveNoteLocally(updated);
    toast.success('Note unarchived');

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, { isArchived: false });
      } catch (err) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { isArchived: false },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { isArchived: false },
      });
    }
  };

  const handleDelete = async (note) => {
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
      } catch (err) {
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
      } catch (err) {
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

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLabel = selectedLabel
      ? Array.isArray(note.labels) && note.labels.includes(selectedLabel)
      : true;

    return matchesSearch && matchesLabel;
  });

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
            <div className="mb-6 flex items-center gap-2">
              <HiOutlineArchiveBox className="w-5 h-5 text-stone-500" />
              <h1 className="text-lg font-semibold text-stone-800">Archive</h1>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading archive...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 bg-white/60 border border-stone-200/60 rounded-2xl p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center">
                  <HiOutlineArchiveBox className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  No archived notes
                </h3>
                <p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  Notes you archive are moved here to keep your main dashboard clean
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => {}}
                    onDelete={handleDelete}
                    onTogglePin={() => {}}
                    onToggleArchive={handleUnarchive}
                    onChangeColor={handleChangeColor}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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

