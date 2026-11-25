import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiBars3BottomLeft,
} from 'react-icons/hi2';

export default function SearchBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onToggleSidebar,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            title="Menu"
          >
            <HiBars3BottomLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <span className="font-semibold text-lg text-stone-800 tracking-tight hidden sm:inline">
              NoteSync
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search your notes and checklists..."
              className="w-full pl-9 pr-8 py-2 bg-stone-100 border border-transparent rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:border-amber-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border border-stone-200 p-1 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Grid view"
          >
            <HiOutlineSquares2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="List view"
          >
            <HiOutlineBars3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

