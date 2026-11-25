import { useState } from 'react';
import { HiOutlineTag, HiOutlineTrash, HiOutlineXMark, HiOutlinePlus } from 'react-icons/hi2';

export default function LabelManager({
  labels = [],
  onCreateLabel,
  onDeleteLabel,
  onClose,
}) {
  const [newLabelName, setNewLabelName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onCreateLabel(newLabelName.trim());
    setNewLabelName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <HiOutlineTag className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-stone-800">Manage Labels</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Create new label..."
              className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:bg-white focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {labels.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                No labels created yet. Add one above!
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HiOutlineTag className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-700">{label.name}</span>
                  </div>
                  <button
                    onClick={() => onDeleteLabel(label.id)}
                    className="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-white transition-colors"
                    title="Delete label"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

