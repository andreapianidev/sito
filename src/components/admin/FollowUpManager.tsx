import React, { useState, useEffect } from 'react';
import { Calendar, User, TrendingUp, Clock, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import FollowUpProgressModal from './FollowUpProgressModal';
import CreatePlanModalEnhanced from './CreatePlanModalEnhanced';

interface FollowUpAppointment {
  id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  message: string | null;
  user_profiles: {
    full_name: string;
    email: string;
  };
}

export default function FollowUpManager() {
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<FollowUpAppointment | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('scheduled');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          user_profiles!appointments_user_id_fkey(full_name, email)
        `)
        .eq('appointment_type', 'follow_up')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (filter === 'scheduled') {
        query = query.in('status', ['pending', 'confirmed']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackProgress = (appointment: FollowUpAppointment) => {
    setSelectedAppointment(appointment);
    setIsProgressModalOpen(true);
  };

  const handleEditPlan = async (appointment: FollowUpAppointment) => {
    try {
      // Load current plan for this user
      const { data: plan, error } = await supabase
        .from('nutritional_plans')
        .select('*')
        .eq('user_id', appointment.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!plan) {
        alert('Nessun piano nutrizionale trovato per questo utente. Creane uno prima di modificarlo.');
        return;
      }

      setSelectedPlan(plan);
      setIsPlanModalOpen(true);
    } catch (err: any) {
      console.error('Error loading plan:', err);
      alert('Errore nel caricamento del piano: ' + err.message);
    }
  };

  const handleProgressSaved = () => {
    loadAppointments();
  };

  const handlePlanUpdated = () => {
    setIsPlanModalOpen(false);
    setSelectedPlan(null);
    loadAppointments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-burgundy"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestione Follow-Up</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'scheduled'
                  ? 'bg-brand-burgundy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Programmati
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-brand-burgundy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completati
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-burgundy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun follow-up {filter === 'scheduled' ? 'programmato' : filter === 'completed' ? 'completato' : 'disponibile'}</p>
            <p className="text-gray-400 text-sm mt-2">
              Gli appuntamenti di tipo "follow-up" appariranno qui
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-brand-burgundy" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.user_profiles.full_name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {appointment.status === 'completed'
                          ? 'Completato'
                          : appointment.status === 'confirmed'
                          ? 'Confermato'
                          : appointment.status === 'pending'
                          ? 'In Attesa'
                          : appointment.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.appointment_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.appointment_time}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">{appointment.user_profiles.email}</p>

                    {appointment.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{appointment.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {(appointment.status === 'confirmed' || appointment.status === 'pending' || appointment.status === 'completed') && (
                      <>
                        <button
                          onClick={() => handleTrackProgress(appointment)}
                          className="px-4 py-2 bg-brand-burgundy text-white rounded-xl hover:bg-brand-burgundy-dark transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                        >
                          <TrendingUp className="w-4 h-4" />
                          {appointment.status === 'completed' ? 'Vedi Progressi' : 'Traccia Progressi'}
                        </button>
                        <button
                          onClick={() => handleEditPlan(appointment)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                        >
                          <Edit className="w-4 h-4" />
                          Modifica Piano
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-Up Progress Modal */}
      {selectedAppointment && (
        <FollowUpProgressModal
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onProgressSaved={handleProgressSaved}
          onEditPlan={() => handleEditPlan(selectedAppointment)}
        />
      )}

      {/* Edit Plan Modal - Create Revision Mode */}
      <CreatePlanModalEnhanced
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        onPlanCreated={handlePlanUpdated}
        editingPlan={selectedPlan}
        createRevision={true}
      />
    </>
  );
}
