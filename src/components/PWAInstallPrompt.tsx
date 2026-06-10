import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!isVisible || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-full flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Installa l'App</h3>
          <p className="text-sm text-gray-600 mb-3">
            Aggiungi l'app alla schermata home per un accesso rapido e notifiche sui tuoi appuntamenti.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={installApp}
              className="bg-brand-burgundy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-burgundy/90 transition-colors duration-200 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Installa</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;