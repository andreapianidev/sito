import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Activity,
  Euro,
  Edit,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import FollowUpProgressModal from './FollowUpProgressModal';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreatePlan: (userId: string) => void;
  onEditPlan?: (userId: string, plan: any) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  onCreatePlan,
  onEditPlan
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'info' | 'plans' | 'appointments' | 'payments'>('info');
  const [plans, setPlans] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedFollowUpAppointment, setSelectedFollowUpAppointment] = useState<any>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const activeRequestIdRef = useRef(0);

  const resetModalData = useCallback(() => {
    setUser(null);
    setPlans([]);
    setAppointments([]);
    setAssessments([]);
    setPayments([]);
  }, []);

  const loadUserData = useCallback(
    async (targetUserId: string, signal?: AbortSignal) => {
      const requestId = ++activeRequestIdRef.current;

      try {
        setLoading(true);
        resetModalData();

        const results = await Promise.allSettled([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', targetUserId)
            .single()
            .abortSignal(signal),

          supabase
            .from('nutritional_plans')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .abortSignal(signal),

          supabase
            .from('appointments')
            .select('*')
            .eq('user_id', targetUserId)
            .order('appointment_date', { ascending: false })
            .abortSignal(signal),

          supabase
            .from('user_assessments')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .abortSignal(signal),

          supabase
            .from('stripe_payments')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .abortSignal(signal)
        ]);

        if (signal?.aborted || requestId !== activeRequestIdRef.current) {
          return;
        }

        const [
          userResult,
          plansResult,
          appointmentsResult,
          assessmentsResult,
          paymentsResult
        ] = results;

        // USER PROFILE = CRITICO
        if (userResult.status === 'rejected') {
          throw userResult.reason;
        }

        if (userResult.value.error) {
          throw userResult.value.error;
        }

        setUser(userResult.value.data);

        // DATI SECONDARI = NON BLOCCANTI
        if (plansResult.status === 'fulfilled' && !plansResult.value.error) {
          setPlans(plansResult.value.data || []);
        } else {
          console.warn('Could not load plans:', plansResult);
          setPlans([]);
        }

        if (appointmentsResult.status === 'fulfilled' && !appointmentsResult.value.error) {
          setAppointments(appointmentsResult.value.data || []);
        } else {
          console.warn('Could not load appointments:', appointmentsResult);
          setAppointments([]);
        }

        if (assessmentsResult.status === 'fulfilled' && !assessmentsResult.value.error) {
          setAssessments(assessmentsResult.value.data || []);
        } else {
          console.warn('Could not load assessments:', assessmentsResult);
          setAssessments([]);
        }

        if (paymentsResult.status === 'fulfilled' && !paymentsResult.value.error) {
          setPayments(paymentsResult.value.data || []);
        } else {
          console.warn('Could not load payments:', paymentsResult);
          setPayments([]);
        }
      } catch (error: any) {
        if (signal?.aborted || requestId !== activeRequestIdRef.current) {
          return;
        }

        console.error('Error loading user data:', error);
        resetModalData();
      } finally {
        if (!signal?.aborted && requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [resetModalData]
  );

  useEffect(() => {
    if (!isOpen || !userId) {
      return;
    }

    const abortController = new AbortController();
    loadUserData(userId, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [isOpen, userId, loadUserData]);

  const handleProgressSaved = useCallback(() => {
    if (!userId) return;

    const abortController = new AbortController();
    loadUserData(userId, abortController.signal);
  }, [userId, loadUserData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Non disponibile';

    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return 'Non disponibile';

    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-white rounded-t-3xl border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Caricamento...'}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-burgundy"></div>
          </div>
        ) : (
          <>
            <div className="flex space-x-2 px-6 pt-4 border-b border-gray-200">
              <button
                onClick={() => setActiveSection('info')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'info'
                    ? 'text-brand-burgundy border-b-2 border-brand-burgundy'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Informazioni
              </button>
              <button
                onClick={() => setActiveSection('plans')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'plans'
                    ? 'text-brand-burgundy border-b-2 border-brand-burgundy'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Piani ({plans.length})
              </button>
              <button
                onClick={() => setActiveSection('appointments')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'appointments'
                    ? 'text-brand-burgundy border-b-2 border-brand-burgundy'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Appuntamenti ({appointments.length})
              </button>
              <button
                onClick={() => setActiveSection('payments')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === 'payments'
                    ? 'text-brand-burgundy border-b-2 border-brand-burgundy'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pagamenti ({payments.length})
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {activeSection === 'info' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-brand-burgundy" />
                        Dati Personali
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Mail className="w-4 h-4 mr-3 text-gray-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{user?.email || 'Non disponibile'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Phone className="w-4 h-4 mr-3 text-gray-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600">Telefono</p>
                            <p className="font-medium text-gray-900">{user?.phone || 'Non disponibile'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-3 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Indirizzo Completo</p>
                            <p className="font-medium text-gray-900">{user?.address || 'Non disponibile'}</p>
                            {(user?.city || user?.postal_code || user?.province) && (
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                {user?.city && (
                                  <div>
                                    <p className="text-xs text-gray-500">Città</p>
                                    <p className="text-sm font-medium text-gray-800">{user.city}</p>
                                  </div>
                                )}
                                {user?.postal_code && (
                                  <div>
                                    <p className="text-xs text-gray-500">CAP</p>
                                    <p className="text-sm font-medium text-gray-800">{user.postal_code}</p>
                                  </div>
                                )}
                                {user?.province && (
                                  <div>
                                    <p className="text-xs text-gray-500">Provincia</p>
                                    <p className="text-sm font-medium text-gray-800 uppercase">{user.province}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 mr-3 text-gray-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600">Registrato il</p>
                            <p className="font-medium text-gray-900">{formatDate(user?.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-brand-burgundy" />
                        Dati Fatturazione
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Codice Fiscale</p>
                          <p className="font-medium text-gray-900">{user?.fiscal_code || 'Non disponibile'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Partita IVA</p>
                          <p className="font-medium text-gray-900">{user?.vat_number || 'Non disponibile'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Codice SDI</p>
                          <p className="font-medium text-gray-900">{user?.sdi_code || 'Non disponibile'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">PEC</p>
                          <p className="font-medium text-gray-900">{user?.pec_email || 'Non disponibile'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-brand-burgundy/5 to-brand-pink/5 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-brand-burgundy" />
                        Abbonamento
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Tipo</p>
                          <p className="font-medium text-brand-burgundy capitalize">{user?.subscription_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Stato</p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              user?.subscription_status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : user?.subscription_status === 'trial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user?.subscription_status}
                          </span>
                        </div>
                        {user?.subscription_expires_at && (
                          <div>
                            <p className="text-xs text-gray-600">Scadenza</p>
                            <p className="font-medium text-gray-900">{formatDate(user.subscription_expires_at)}</p>
                          </div>
                        )}
                        {user?.is_trial && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium">Periodo di prova attivo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {assessments.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-brand-burgundy" />
                          Ultima Valutazione
                        </h3>
                        <div className="space-y-3">
                          {assessments[0].weight && (
                            <div>
                              <p className="text-xs text-gray-600">Peso</p>
                              <p className="font-medium text-gray-900">{assessments[0].weight} kg</p>
                            </div>
                          )}
                          {assessments[0].height && (
                            <div>
                              <p className="text-xs text-gray-600">Altezza</p>
                              <p className="font-medium text-gray-900">{assessments[0].height} cm</p>
                            </div>
                          )}
                          {assessments[0].primary_goal && (
                            <div>
                              <p className="text-xs text-gray-600">Obiettivo</p>
                              <p className="font-medium text-gray-900">{assessments[0].primary_goal}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-600">Data</p>
                            <p className="font-medium text-gray-900">{formatDate(assessments[0].created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => onCreatePlan(userId)}
                      className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors font-medium"
                    >
                      Crea Nuovo Piano
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'plans' && (
                <div className="space-y-4">
                  {plans.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nessun piano nutrizionale trovato</p>
                      <button
                        onClick={() => onCreatePlan(userId)}
                        className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors font-medium"
                      >
                        Crea Primo Piano
                      </button>
                    </div>
                  ) : (
                    plans.map((plan) => (
                      <div key={plan.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{plan.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                plan.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : plan.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {plan.status}
                            </span>
                            {onEditPlan && (
                              <button
                                onClick={() => onEditPlan(userId, plan)}
                                className="p-2 text-brand-burgundy hover:bg-brand-burgundy/10 rounded-lg transition-colors"
                                title="Riprendi e modifica"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600">Calorie</p>
                            <p className="font-semibold text-brand-burgundy">{plan.daily_calories} kcal</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Proteine</p>
                            <p className="font-semibold text-green-600">{plan.daily_protein}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Carboidrati</p>
                            <p className="font-semibold text-orange-600">{plan.daily_carbs}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Grassi</p>
                            <p className="font-semibold text-purple-600">{plan.daily_fats}g</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>📅 Inizio: {formatDate(plan.start_date)}</span>
                            {plan.end_date && <span>🏁 Fine: {formatDate(plan.end_date)}</span>}
                          </div>
                          <span className="text-xs">Creato il {formatDate(plan.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'appointments' && (
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nessun appuntamento trovato</p>
                    </div>
                  ) : (
                    appointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg capitalize">{appointment.service_type}</h4>
                            <p className="text-sm text-gray-600 mt-1">{appointment.appointment_type}</p>
                            {appointment.appointment_type === 'follow_up' && (
                              <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                Follow-Up
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Data</p>
                            <p className="font-semibold text-gray-900">{formatDate(appointment.appointment_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Orario</p>
                            <p className="font-semibold text-gray-900">{appointment.appointment_time}</p>
                          </div>
                          {appointment.location && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-600">Luogo</p>
                              <p className="font-semibold text-gray-900">{appointment.location}</p>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-600">Note</p>
                              <p className="text-sm text-gray-700">{appointment.notes}</p>
                            </div>
                          )}
                        </div>

                        {appointment.appointment_type === 'follow_up' && appointment.status !== 'cancelled' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                setSelectedFollowUpAppointment(appointment);
                                setShowFollowUpModal(true);
                              }}
                              className="w-full px-4 py-2 bg-brand-burgundy text-white rounded-xl hover:bg-brand-burgundy-dark transition-colors flex items-center justify-center space-x-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span>{appointment.status === 'completed' ? 'Visualizza' : 'Traccia'} Progressi</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'payments' && (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <Euro className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nessun pagamento registrato</p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-2xl p-6 text-white mb-6">
                        <h3 className="text-lg font-semibold mb-4">Riepilogo Pagamenti</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-white/80">Totale Pagato</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(
                                payments
                                  .filter((p) => p.status === 'succeeded')
                                  .reduce((sum, p) => sum + p.amount, 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-white/80">Pagamenti Completati</p>
                            <p className="text-2xl font-bold">
                              {payments.filter((p) => p.status === 'succeeded').length}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-white/80">Ultimo Pagamento</p>
                            <p className="text-lg font-semibold">
                              {payments[0] ? formatDate(payments[0].created_at) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {payments.map((payment) => (
                        <div key={payment.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{formatCurrency(payment.amount)}</h4>
                              <p className="text-sm text-gray-600 mt-1">{payment.description || 'Pagamento'}</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                payment.status === 'succeeded'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-600">Data</p>
                              <p className="font-medium text-gray-900">{formatDateTime(payment.created_at)}</p>
                            </div>
                            {payment.payment_method && (
                              <div>
                                <p className="text-xs text-gray-600">Metodo</p>
                                <p className="font-medium text-gray-900 capitalize">{payment.payment_method}</p>
                              </div>
                            )}
                            {payment.stripe_payment_id && (
                              <div>
                                <p className="text-xs text-gray-600">ID Stripe</p>
                                <p className="font-mono text-xs text-gray-700">
                                  {payment.stripe_payment_id.substring(0, 20)}...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showFollowUpModal && selectedFollowUpAppointment && (
        <FollowUpProgressModal
          isOpen={showFollowUpModal}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedFollowUpAppointment(null);
          }}
          appointment={selectedFollowUpAppointment}
          onProgressSaved={handleProgressSaved}
        />
      )}
    </div>
  );
};

export default UserDetailsModal;