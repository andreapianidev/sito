import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, XCircle, Video, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppointmentManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onUpdate: () => void;
}

const AppointmentManageModal: React.FC<AppointmentManageModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    appointment_date: '',
    appointment_time: '',
    location: '',
    meet_link: '',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        status: appointment.status || 'pending',
        appointment_date: appointment.appointment_date || '',
        appointment_time: appointment.appointment_time || '',
        location: appointment.location || 'online',
        meet_link: appointment.meet_link || '',
      });
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate appointment ID before update
      const appointmentId = appointment?.id;
      if (!appointmentId) {
        throw new Error('ID appuntamento mancante');
      }

      // Update appointment using ONLY the ID
      const { error } = await supabase
        .from('appointments')
        .update({
          status: formData.status,
          appointment_date: formData.appointment_date || null,
          appointment_time: formData.appointment_time || null,
          location: formData.location,
          meet_link: formData.meet_link || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      alert('Errore nell\'aggiornamento dell\'appuntamento: ' + (error.message || 'Errore sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo appuntamento?')) return;

    setLoading(true);
    try {
      // Validate appointment ID before delete
      const appointmentId = appointment?.id;
      if (!appointmentId) {
        throw new Error('ID appuntamento mancante');
      }

      // Delete appointment using ONLY the ID
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      alert('Errore nell\'eliminazione dell\'appuntamento: ' + (error.message || 'Errore sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getServiceName = (serviceType: string) => {
    const services: Record<string, string> = {
      basic: 'Consulenza Semplice',
      premium: 'Consulenza con Menù',
      complete: 'Consulenza Completa + PT',
      'follow-up': 'Controllo Mensile',
    };
    return services[serviceType] || serviceType;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-brand-burgundy to-brand-pink p-6 text-white sticky top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestione Appuntamento</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-brand-burgundy" />
              Informazioni Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium text-gray-900">
                  {appointment?.user_profiles?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">
                  {appointment?.user_profiles?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefono</p>
                <p className="font-medium text-gray-900">
                  {appointment?.user_profiles?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Servizio</p>
                <p className="font-medium text-gray-900">
                  {getServiceName(appointment?.service_type)}
                </p>
              </div>
            </div>

            {appointment?.message && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Messaggio del Cliente</p>
                <p className="text-sm text-gray-900 bg-white rounded-lg p-3">
                  {appointment.message}
                </p>
              </div>
            )}

            {appointment?.meet_link && appointment.is_online && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Link Google Meet (Auto-generato)</p>
                <a
                  href={appointment.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {appointment.meet_link}
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Questo link è visibile anche al cliente nella sua sezione appuntamenti
                </p>
              </div>
            )}
          </div>

          {/* Appointment Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato Appuntamento
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                required
              >
                <option value="pending">In Attesa</option>
                <option value="confirmed">Confermato</option>
                <option value="completed">Completato</option>
                <option value="cancelled">Annullato</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data
                </label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Orario
                </label>
                <input
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Luogo
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              >
                <option value="online">Online (Videochiamata)</option>
                <option value="biostore">Bio Store - Via Biagio Petrocelli 253</option>
                <option value="studio">Studio - Via Rocca Imperiale 42</option>
                <option value="fitgo">Fit&Go - Via della Lega Lombarda 25/27</option>
              </select>
            </div>

            {/* Google Meet Link */}
            {formData.location === 'online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="w-4 h-4 inline mr-1" />
                  Link Google Meet
                </label>
                <input
                  type="url"
                  value={formData.meet_link}
                  onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Il link verrà mostrato al cliente quando l'appuntamento è confermato
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Elimina
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-brand-burgundy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManageModal;
