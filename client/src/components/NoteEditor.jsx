import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlineCheck,
  HiOutlineBold,
  HiOutlineItalic,
  HiOutlineListBullet,
} from 'react-icons/hi2';
import { BsPin, BsPinFill } from 'react-icons/bs';

const COLOR_OPTIONS = [
  { name: 'default', bg: 'bg-white border-stone-300' },
  { name: 'yellow', bg: 'bg-yellow-100 border-yellow-300' },
  { name: 'green', bg: 'bg-green-100 border-green-300' },
  { name: 'blue', bg: 'bg-blue-100 border-blue-300' },
  { name: 'pink', bg: 'bg-pink-100 border-pink-300' },
  { name: 'purple', bg: 'bg-purple-100 border-purple-300' },
  { name: 'orange', bg: 'bg-orange-100 border-orange-300' },
];

const MODAL_COLORS = {
  default: 'bg-white',
  yellow: 'bg-yellow-50/90',
  green: 'bg-green-50/90',
  blue: 'bg-blue-50/90',
  pink: 'bg-pink-50/90',
  purple: 'bg-purple-50/90',
  orange: 'bg-orange-50/90',
};

export default function NoteEditor({
  note,
  labels = [],
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || 'default');
  const [isPinned, setIsPinned] = useState(Boolean(note?.isPinned));
  const [selectedLabels, setSelectedLabels] = useState(note?.labels || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [lastSaved, setLastSaved] = useState(note?.updatedAt || null);

  const noteIdRef = useRef(
    note?.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );
  const textareaRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, content, color, isPinned, selectedLabels]);

  const handleAutoSave = () => {
    if (!title.trim() && !content.trim()) return;

    const payload = {
      ...(note || {}),
      id: noteIdRef.current,
      title: title.trim(),
      content,
      type: 'note',
      color,
      isPinned,
      labels: selectedLabels,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload, true);
    setLastSaved(payload.updatedAt);
  };

  const handleManualSave = () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }

    const payload = {
      ...(note || {}),
      id: noteIdRef.current,
      title: title.trim(),
      content,
      type: 'note',
      color,
      isPinned,
      labels: selectedLabels,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload, false);
    onClose();
  };

  const handleToggleLabel = (labelName) => {
    if (selectedLabels.includes(labelName)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== labelName));
    } else {
      setSelectedLabels([...selectedLabels, labelName]);
    }
  };

  const applyFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const addBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let replacement = '';
    if (selectedText.trim()) {
      replacement = selectedText
        .split('\n')
        .map((line) => (line.startsWith('• ') ? line : `• ${line}`))
        .join('\n');
    } else {
      replacement = '\n• ';
    }

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const modalBg = MODAL_COLORS[color] || MODAL_COLORS.default;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`${modalBg} rounded-2xl w-full max-w-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="flex-1 text-xl font-semibold text-stone-800 placeholder-stone-400 bg-transparent border-none focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-xl transition-colors ${
                isPinned
                  ? 'bg-amber-100 text-amber-600'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              {isPinned ? (
                <BsPinFill className="w-5 h-5" />
              ) : (
                <BsPin className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleManualSave}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Close and save"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-6 py-1.5 border-y border-stone-200/60 bg-white/50 text-stone-600">
          <button
            type="button"
            onClick={() => applyFormatting('**', '**')}
            className="p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors"
            title="Bold (**text**)"
          >
            <HiOutlineBold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('*', '*')}
            className="p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors"
            title="Italic (*text*)"
          >
            <HiOutlineItalic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addBulletList}
            className="p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors"
            title="Bullet List"
          >
            <HiOutlineListBullet className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Take a note..."
            rows={12}
            className="w-full text-stone-700 placeholder-stone-400 bg-transparent border-none resize-none focus:outline-none text-base leading-relaxed"
          />
        </div>

        {selectedLabels.length > 0 && (
          <div className="px-6 py-2 flex flex-wrap gap-1.5">
            {selectedLabels.map((labelName) => (
              <span
                key={labelName}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200/70 text-stone-700 rounded-full text-xs font-medium"
              >
                {labelName}
                <button
                  type="button"
                  onClick={() => handleToggleLabel(labelName)}
                  className="hover:text-red-500"
                >
                  <HiOutlineXMark className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="px-6 py-3 border-t border-stone-200/60 bg-white/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-stone-200">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-5 h-5 rounded-full border ${c.bg} transition-transform ${
                    color === c.name ? 'scale-125 ring-2 ring-amber-500 ring-offset-1' : 'hover:scale-110'
                  }`}
                  title={c.name}
                />
              ))}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                title="Labels"
              >
                <HiOutlineTag className="w-5 h-5" />
              </button>

              {showLabelPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 p-2 z-20">
                  <p className="text-xs font-semibold text-stone-400 px-2 py-1 uppercase">
                    Select Labels
                  </p>
                  {labels.length === 0 ? (
                    <p className="text-xs text-stone-400 px-2 py-2">
                      No labels created
                    </p>
                  ) : (
                    labels.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleToggleLabel(l.name)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <span className="truncate">{l.name}</span>
                        {selectedLabels.includes(l.name) && (
                          <HiOutlineCheck className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-stone-400 hidden sm:inline">
                Saved {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
