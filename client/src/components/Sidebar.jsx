import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineArchiveBox,
  HiOutlineTrash,
  HiOutlineTag,
  HiOutlinePencilSquare,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Notes', icon: HiOutlineDocumentText },
  { path: '/archive', label: 'Archive', icon: HiOutlineArchiveBox },
  { path: '/trash', label: 'Trash', icon: HiOutlineTrash },
];

export default function Sidebar({
  labels = [],
  selectedLabel,
  onSelectLabel,
  onManageLabels,
  isOpen,
  onClose,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleLabelClick(labelName) {
    if (selectedLabel === labelName) {
      onSelectLabel(null);
    } else {
      onSelectLabel(labelName);
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-stone-200 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 truncate max-w-[140px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-stone-400 truncate max-w-[140px]">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {labels.length > 0 && (
            <div className="mt-4 px-2">
              <p className="px-3 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Labels
              </p>
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleLabelClick(label.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                    selectedLabel === label.name
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <HiOutlineTag className="w-4 h-4" />
                  <span className="truncate">{label.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 px-2">
            <button
              onClick={onManageLabels}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              <span>Manage Labels</span>
            </button>
          </div>
        </nav>

        <div className="p-2 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

