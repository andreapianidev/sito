import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-orange-500 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-center space-x-3">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold">Modalità Offline</h4>
          <p className="text-sm opacity-90">
            Alcune funzionalità potrebbero essere limitate. I tuoi dati verranno sincronizzati quando tornerai online.
          </p>
        </div>
        <button
          onClick={() => setShowOfflineMessage(false)}
          className="text-white/80 hover:text-white transition-colors duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;