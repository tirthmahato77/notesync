import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlineTrash,
  HiOutlineArrowUturnLeft,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import LabelManager from '../components/LabelManager';
import OnlineStatus from '../components/OnlineStatus';

import * as api from '../services/api';
import * as db from '../services/db';

const NOTE_COLORS = {
  default: 'bg-white border-stone-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  pink: 'bg-pink-50 border-pink-200',
  purple: 'bg-purple-50 border-purple-200',
  orange: 'bg-orange-50 border-orange-200',
};

export default function Trash() {
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
      setNotes(localNotes.filter((n) => n.isTrashed));
      setLabels(localLabels);
      setLoading(false);

      if (navigator.onLine) {
        try {
          const [remoteNotes, remoteLabels] = await Promise.all([
            api.getNotes({ trashed: true }),
            api.getLabels(),
          ]);
          setNotes(remoteNotes);
          setLabels(remoteLabels);
        } catch {
        }
      }
    } catch {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (note) => {
    const updated = {
      ...note,
      isTrashed: false,
      trashedAt: null,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await db.saveNoteLocally(updated);
    toast.success('Note restored to Dashboard');

    if (navigator.onLine) {
      try {
        await api.updateNote(note.id, {
          isTrashed: false,
          trashedAt: null,
        });
      } catch (err) {
        await db.addToSyncQueue({
          action: 'update',
          noteId: note.id,
          data: { isTrashed: false, trashedAt: null },
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'update',
        noteId: note.id,
        data: { isTrashed: false, trashedAt: null },
      });
    }
  };

  const handlePermanentDelete = async (note) => {
    const confirmed = window.confirm(
      'Permanently delete this note? This action cannot be undone.'
    );
    if (!confirmed) return;

    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await db.deleteNoteLocally(note.id);
    toast.success('Note permanently deleted');

    if (navigator.onLine) {
      try {
        await api.deleteNote(note.id);
      } catch (err) {
        await db.addToSyncQueue({
          action: 'delete',
          noteId: note.id,
        });
      }
    } else {
      await db.addToSyncQueue({
        action: 'delete',
        noteId: note.id,
      });
    }
  };

  const handleEmptyTrash = async () => {
    if (notes.length === 0) return;
    const confirmed = window.confirm(
      'Permanently delete all notes in Trash? This cannot be undone.'
    );
    if (!confirmed) return;

    const notesToDelete = [...notes];
    setNotes([]);

    for (const note of notesToDelete) {
      await db.deleteNoteLocally(note.id);
      if (navigator.onLine) {
        try {
          await api.deleteNote(note.id);
        } catch (e) {
          await db.addToSyncQueue({ action: 'delete', noteId: note.id });
        }
      } else {
        await db.addToSyncQueue({ action: 'delete', noteId: note.id });
      }
    }

    toast.success('Trash emptied');
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
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <HiOutlineTrash className="w-5 h-5 text-stone-500" />
                <h1 className="text-lg font-semibold text-stone-800">Trash</h1>
              </div>

              {notes.length > 0 && (
                <button
                  onClick={handleEmptyTrash}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  <span>Empty Trash</span>
                </button>
              )}
            </div>

            <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
              <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Notes in Trash can be restored or permanently removed.</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading trash...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 bg-white/60 border border-stone-200/60 rounded-2xl p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center">
                  <HiOutlineTrash className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  Trash is empty
                </h3>
                <p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  Deleted notes are kept here before permanent removal
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
                {filteredNotes.map((note) => {
                  const colorClass =
                    NOTE_COLORS[note.color] || NOTE_COLORS.default;
                  return (
                    <div
                      key={note.id}
                      className={`border rounded-xl p-4 flex flex-col justify-between ${colorClass}`}
                    >
                      <div>
                        <h3 className="font-medium text-stone-800 line-clamp-2">
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-stone-500 mt-2 line-clamp-3">
                          {note.content || 'No content'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(note)}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Restore note"
                        >
                          <HiOutlineArrowUturnLeft className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(note)}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-colors"
                          title="Delete permanently"
                        >
                          <HiOutlineXMark className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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

