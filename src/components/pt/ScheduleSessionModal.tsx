import React, { useState } from 'react';
import { X, Save, Calendar, Clock, MapPin, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ptUserId: string;
  clientUserId?: string;
  clientName?: string;
  onSuccess: () => void;
}

const ScheduleSessionModal: React.FC<Props> = ({ isOpen, onClose, ptUserId, clientUserId, clientName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionMode, setSessionMode] = useState<'in_person' | 'online'>('in_person');
  const [location, setLocation] = useState('');
  const [customMeetLink, setCustomMeetLink] = useState('');
  const [notes, setNotes] = useState('');

  const handleScheduleSession = async () => {
    if (!clientUserId || !sessionDate || !sessionTime) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    if (sessionMode === 'in_person' && !location.trim()) {
      alert('Inserisci il luogo dell\'appuntamento');
      return;
    }

    try {
      setLoading(true);

      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);

      const { error } = await supabase
        .from('pt_session_bookings')
        .insert([{
          pt_user_id: ptUserId,
          client_user_id: clientUserId,
          scheduled_at: sessionDateTime.toISOString(),
          duration_minutes: duration,
          session_type: sessionMode,
          location: sessionMode === 'in_person' ? location : null,
          custom_meet_link: sessionMode === 'online' ? customMeetLink : null,
          status: 'scheduled',
          notes
        }]);

      if (error) throw error;

      alert('Sessione pianificata con successo!');
      onSuccess();
      onClose();

      setSessionDate('');
      setSessionTime('');
      setDuration(60);
      setSessionMode('in_person');
      setLocation('');
      setCustomMeetLink('');
      setNotes('');
    } catch (error) {
      console.error('Error scheduling session:', error);
      alert('Errore nella pianificazione della sessione');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Pianifica Sessione</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {clientName && (
            <div className="p-4 bg-brand-light rounded-lg">
              <p className="text-sm text-gray-600">Cliente:</p>
              <p className="font-semibold text-gray-900">{clientName}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Modalità Sessione *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSessionMode('in_person')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  sessionMode === 'in_person'
                    ? 'border-brand-burgundy bg-brand-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className={`w-6 h-6 mx-auto mb-2 ${sessionMode === 'in_person' ? 'text-brand-burgundy' : 'text-gray-400'}`} />
                <div className="text-center">
                  <p className="font-semibold text-gray-900">In Presenza</p>
                  <p className="text-xs text-gray-600 mt-1">Sessione fisica</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSessionMode('online')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  sessionMode === 'online'
                    ? 'border-brand-burgundy bg-brand-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Video className={`w-6 h-6 mx-auto mb-2 ${sessionMode === 'online' ? 'text-brand-burgundy' : 'text-gray-400'}`} />
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Online</p>
                  <p className="text-xs text-gray-600 mt-1">Video call</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data *
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Ora *
              </label>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durata (minuti)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="15"
              step="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>

          {sessionMode === 'in_person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Luogo *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="es. Palestra Centro, Via Roma 123..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>
          )}

          {sessionMode === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="w-4 h-4 inline mr-2" />
                Link Video Call (opzionale)
              </label>
              <input
                type="url"
                value={customMeetLink}
                onChange={(e) => setCustomMeetLink(e.target.value)}
                placeholder="es. https://meet.google.com/xxx-yyyy-zzz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci il link Google Meet, Zoom o altra piattaforma. Sarà visibile al cliente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note (opzionale)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Note o istruzioni per la sessione..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleScheduleSession}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Pianificazione...' : 'Pianifica Sessione'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;
