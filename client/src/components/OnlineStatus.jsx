import { useState, useEffect } from 'react';
import { HiOutlineWifi, HiOutlineSignal } from 'react-icons/hi2';

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-300 ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {isOnline ? (
        <>
          <HiOutlineWifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </>
      ) : (
        <>
          <HiOutlineSignal className="w-3.5 h-3.5" />
          <span>Offline - changes saved locally</span>
        </>
      )}
    </div>
  );
}

