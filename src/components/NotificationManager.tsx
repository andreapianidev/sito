import React, { useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

interface NotificationManagerProps {
  user?: any;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ user }) => {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Show welcome notification
        new Notification('Notifiche Attivate! 🎉', {
          body: 'Riceverai promemoria per i tuoi appuntamenti',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const scheduleAppointmentReminder = (appointment: any) => {
    if (permission !== 'granted') return;

    // Schedule notification 24 hours before appointment
    const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
    const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();

    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        new Notification('Promemoria Appuntamento 📅', {
          body: `Domani alle ${appointment.time} hai la ${appointment.type}`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `appointment-${appointment.id}`,
          requireInteraction: true
        });
      }, timeUntilReminder);
    }
  };

  if (!isSupported || !user) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {permission === 'granted' ? (
            <Bell className="w-5 h-5 text-green-500" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h4 className="font-semibold text-gray-900">Notifiche</h4>
            <p className="text-sm text-gray-600">
              {permission === 'granted' 
                ? 'Riceverai promemoria per gli appuntamenti'
                : 'Attiva per ricevere promemoria'
              }
            </p>
          </div>
        </div>
        
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="bg-brand-burgundy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-burgundy/90 transition-colors duration-200"
          >
            Attiva
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
