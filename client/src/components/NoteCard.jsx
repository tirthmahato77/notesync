import {
  HiOutlineTrash,
  HiOutlineArchiveBox,
  HiOutlineArchiveBoxArrowDown,
  HiOutlineCheck,
} from 'react-icons/hi2';
import { BsPin, BsPinFill } from 'react-icons/bs';

const NOTE_COLORS = {
  default: 'bg-white border-stone-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  pink: 'bg-pink-50 border-pink-200',
  purple: 'bg-purple-50 border-purple-200',
  orange: 'bg-orange-50 border-orange-200',
};

const COLOR_OPTIONS = [
  { name: 'default', bg: 'bg-white border-stone-300' },
  { name: 'yellow', bg: 'bg-yellow-300' },
  { name: 'green', bg: 'bg-green-300' },
  { name: 'blue', bg: 'bg-blue-300' },
  { name: 'pink', bg: 'bg-pink-300' },
  { name: 'purple', bg: 'bg-purple-300' },
  { name: 'orange', bg: 'bg-orange-300' },
];

import { useState } from 'react';

export default function NoteCard({
  note,
  onClick,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onChangeColor,
  viewMode = 'grid',
}) {
  const [showColors, setShowColors] = useState(false);

  function getContentPreview() {
    if (note.type === 'checklist' && Array.isArray(note.checklist)) {
      return null;
    }
    const text = note.content || '';
    const stripped = text.replace(/<[^>]*>/g, '');
    return stripped.length > 120 ? stripped.substring(0, 120) + '...' : stripped;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const colorClass = NOTE_COLORS[note.color] || NOTE_COLORS.default;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(note)}
        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.isPinned && (
              <BsPinFill className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            <h3 className="font-medium text-stone-800 truncate">
              {note.title || 'Untitled'}
            </h3>
          </div>
          <p className="text-sm text-stone-500 truncate mt-1">
            {getContentPreview() || 'No content'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {note.labels?.map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full"
            >
              {label}
            </span>
          ))}
          <span className="text-xs text-stone-400 ml-2">
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative border rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col ${colorClass}`}
      onClick={() => onClick(note)}
    >
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-stone-800 line-clamp-2">
            {note.title || 'Untitled'}
          </h3>
          {note.isPinned && (
            <BsPinFill className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {note.type === 'checklist' && Array.isArray(note.checklist) ? (
          <div className="mt-2 space-y-1.5">
            {note.checklist.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    item.checked
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-stone-300'
                  }`}
                >
                  {item.checked && (
                    <HiOutlineCheck className="w-3 h-3 text-white" />
                  )}
                </div>
                <span
                  className={`truncate ${
                    item.checked
                      ? 'line-through text-stone-400'
                      : 'text-stone-600'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 4 && (
              <p className="text-xs text-stone-400">
                +{note.checklist.length - 4} more items
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-500 mt-2 line-clamp-4">
            {getContentPreview() || 'No content'}
          </p>
        )}
      </div>

      {note.labels?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {note.labels.map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 text-xs bg-stone-100/80 text-stone-500 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-stone-400">
          {formatDate(note.updatedAt)}
        </span>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onTogglePin(note)}
            className={`p-1.5 rounded-full hover:bg-stone-100 ${
              note.isPinned ? 'text-amber-500' : 'text-stone-400'
            }`}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            {note.isPinned ? (
              <BsPinFill className="w-4 h-4" />
            ) : (
              <BsPin className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onToggleArchive(note)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
            title={note.isArchived ? 'Unarchive' : 'Archive'}
          >
            {note.isArchived ? (
              <HiOutlineArchiveBoxArrowDown className="w-4 h-4" />
            ) : (
              <HiOutlineArchiveBox className="w-4 h-4" />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColors(!showColors)}
              className="p-1.5 rounded-full hover:bg-stone-100"
              title="Change color"
            >
              <div className="w-4 h-4 rounded-full border-2 border-stone-300 bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200"></div>
            </button>
            {showColors && (
              <div className="absolute bottom-full right-0 mb-1 p-2 bg-white rounded-lg shadow-lg border border-stone-200 flex gap-1 z-10">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      onChangeColor(note, color.name);
                      setShowColors(false);
                    }}
                    className={`w-6 h-6 rounded-full border ${color.bg} hover:scale-110 transition-transform`}
                    title={color.name}
                  ></button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onDelete(note)}
            className="p-1.5 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-500"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

