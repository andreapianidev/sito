import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Video, CreditCard, FileText, PlayCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Appointment {
  id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  is_online: boolean;
  message: string;
  meet_link: string | null;
  created_at: string;
}

interface AppointmentsListProps {
  userId: string | undefined;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ userId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadAppointments();
    }
  }, [userId]);

  const loadAppointments = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (appointment: Appointment) => {
    try {
      setProcessingPayment(appointment.id);

      const servicesPricing: Record<string, number> = {
        basic: 97,
        premium: 197,
        complete: 349,
        'follow-up': 47,
      };

      const amount = servicesPricing[appointment.service_type] || 97;

      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            serviceType: appointment.service_type,
            appointmentId: appointment.id,
            userId: userId,
            userEmail: '',
            userName: '',
            userPhone: '',
            addFollowUps: false,
          },
        }
      );

      if (sessionError) throw sessionError;

      if (sessionData?.url) {
        window.location.href = sessionData.url;
      } else {
        throw new Error('URL di pagamento non ricevuto');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Errore durante l\'avvio del pagamento. Riprova più tardi.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getServiceName = (serviceType: string) => {
    const services: Record<string, string> = {
      basic: 'Consulenza Semplice',
      premium: 'Consulenza con Menù',
      complete: 'Consulenza Completa + PT',
      'follow-up': 'Controllo Mensile',
    };
    return services[serviceType] || serviceType;
  };

  const getLocationName = (location: string) => {
    const locations: Record<string, string> = {
      online: 'Online (Videochiamata)',
      biostore: 'Shop Online - Via Biagio Petrocelli 253',
      studio: 'Studio - Via Rocca Imperiale 42',
      fitgo: 'Fit&Go - Via della Lega Lombarda 25/27',
    };
    return locations[location] || location;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      confirmed: {
        label: 'Confermato',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      pending: {
        label: 'In Attesa',
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
      },
      completed: {
        label: 'Completato',
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
      },
      cancelled: {
        label: 'Annullato',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data da definire';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-burgundy"></div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun appuntamento</h3>
          <p className="text-gray-600">Prenota il tuo primo appuntamento per iniziare!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-brand-burgundy to-brand-pink p-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          I Tuoi Appuntamenti ({appointments.length})
        </h3>
        <p className="text-white/90 text-sm mt-1">Storico completo delle tue prenotazioni</p>
      </div>

      <div className="p-6 space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-1">
                  {getServiceName(appointment.service_type)}
                </h4>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(appointment.status)}
                  {appointment.is_online && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Video className="w-4 h-4 mr-1" />
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-brand-burgundy mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Data</p>
                  <p className="text-sm text-gray-600">
                    {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'Da definire'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-brand-burgundy mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Orario</p>
                  <p className="text-sm text-gray-600">
                    {appointment.appointment_time || 'Da definire'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-brand-burgundy mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Luogo</p>
                  <p className="text-sm text-gray-600">{getLocationName(appointment.location)}</p>
                </div>
              </div>
            </div>

            {appointment.meet_link && appointment.is_online && appointment.status === 'confirmed' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Link Videochiamata Google Meet
                    </p>
                    <p className="text-xs text-blue-700 mb-3">
                      Clicca sul pulsante qui sotto per entrare nella videochiamata all'orario dell'appuntamento
                    </p>
                    <a
                      href={appointment.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Entra nella Videochiamata
                    </a>
                  </div>
                </div>
              </div>
            )}

            {appointment.is_online && appointment.status === 'confirmed' && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5 mb-4">
                <div className="flex items-start space-x-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-orange-900 mb-1">
                      Importante: Preparazione all'Appuntamento
                    </h4>
                    <p className="text-sm text-orange-800">
                      Per la tua consulenza online, ti chiediamo di preparare quanto segue:
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <PlayCircle className="w-5 h-5 text-brand-burgundy mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          1. Video Tutorial: Come Prendere le Circonferenze
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          Guarda attentamente questo video per imparare la tecnica corretta di misurazione delle circonferenze corporee
                        </p>
                        <a
                          href="https://drive.google.com/file/d/1GM3m5tsa4ylxMpEMSWqE8stqJIVj8IhL/view?usp=drive_link"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-burgundy to-brand-pink text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Guarda il Video Tutorial
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-brand-burgundy mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          2. Modulo Privacy e Consenso Informato
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          Scarica, compila e firma il modulo. Portalo con te il giorno dell'appuntamento (puoi anche inviare una foto via email)
                        </p>
                        <a
                          href="https://hjmecstedaibgmdawbtp.supabase.co/storage/v1/object/public/varie/PRIVACY.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          download="Modulo_Privacy_Consenso_Nardari_Vilma.pdf"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-burgundy to-brand-pink text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Scarica Modulo Privacy
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-white/60 backdrop-blur rounded-lg p-3 border border-orange-100">
                  <p className="text-xs text-orange-800 font-medium">
                    Ti ricordiamo che questi documenti sono necessari per svolgere la consulenza nel rispetto delle normative GDPR vigenti.
                  </p>
                </div>
              </div>
            )}

            {!appointment.is_online && appointment.location && appointment.status === 'confirmed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Indirizzo dell'Appuntamento
                    </p>
                    <p className="text-sm text-green-800 font-medium">
                      {getLocationName(appointment.location)}
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      Ti aspettiamo all'indirizzo indicato
                    </p>
                  </div>
                </div>
              </div>
            )}

            {appointment.message && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Note</p>
                <p className="text-sm text-gray-600">{appointment.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Prenotato il {new Date(appointment.created_at).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              {appointment.status === 'pending' && (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-yellow-600 font-medium">
                    In attesa di conferma pagamento
                  </p>
                  <button
                    onClick={() => handlePayNow(appointment)}
                    disabled={processingPayment === appointment.id}
                    className="inline-flex items-center px-4 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {processingPayment === appointment.id ? 'Elaborazione...' : 'Paga Ora'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsList;
