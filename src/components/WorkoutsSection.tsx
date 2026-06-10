import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { Play, X, ExternalLink, Dumbbell, Clock, TrendingUp, Target, Plus } from 'lucide-react';

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  weight_kg: number | null;
  notes: string | null;
  video_url: string | null;
  order_index: number;
  workout_id?: string; // (arriva dalla query select('*'), lo uso in grouping)
}

interface Workout {
  id: string;
  title: string;
  description: string;
  workout_type: string;
  duration_minutes: number;
  difficulty: string;
  target_muscles: string[];
  equipment_needed: string[];
  created_at: string;
}

interface WorkoutsSectionProps {
  userId: string;
  userProfile?: any;
}

const WorkoutsSection: React.FC<WorkoutsSectionProps> = ({ userId, userProfile }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<{ [key: string]: Exercise[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadWorkouts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const { data: workoutsData, error: workoutsError } = await supabase
        .from('pt_workouts')
        .select('*')
        .eq('client_user_id', userId)
        .order('created_at', { ascending: false });

      if (workoutsError) throw workoutsError;

      setWorkouts(workoutsData || []);

      if (workoutsData && workoutsData.length > 0) {
        const workoutIds = workoutsData.map(w => w.id);

        const { data: exercisesData, error: exercisesError } = await supabase
          .from('pt_workout_exercises')
          .select('*')
          .in('workout_id', workoutIds)
          .order('order_index', { ascending: true });

        if (exercisesError) throw exercisesError;

        const exercisesByWorkout: { [key: string]: Exercise[] } = {};
        exercisesData?.forEach((exercise: any) => {
          const wid = exercise.workout_id;
          if (!wid) return;
          if (!exercisesByWorkout[wid]) exercisesByWorkout[wid] = [];
          exercisesByWorkout[wid].push(exercise);
        });

        setExercises(exercisesByWorkout);
      } else {
        setExercises({});
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useRefreshOnFocus(() => loadWorkouts(true));

  const getDifficultyColor = (difficulty: string) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
      case 'intermedio':
        return 'bg-orange-100 text-orange-800';
      case 'advanced':
      case 'avanzato':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Tipologia workout: nel tuo DB workout_type è "generated"
  // Non ha senso la vecchia mappatura strength/cardio ecc.
  const getWorkoutTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'generated') return { label: 'Generato', emoji: '✨' };
    return { label: type || 'Allenamento', emoji: '🏋️' };
  };

  // Estrae i "Giorni consigliati" dalla description (se presente)
  const extractSuggestedDays = (desc?: string) => {
    if (!desc) return [];
    const match = desc.match(/Giorni consigliati:\s*(.*)/i);
    if (!match?.[1]) return [];
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
  };

  const openWorkoutDetail = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowDetailModal(true);
  };

  const handleGenerateWorkout = async () => {
    if (!userId) return;

    try {
      setIsGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sessione scaduta. Effettua di nuovo il login.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-workout-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella generazione del piano allenamento');
      }

      const { workoutId } = await response.json();
      console.log('Piano allenamento generato:', workoutId);

      await loadWorkouts();
      alert('Piano allenamento generato con successo!');
    } catch (error: any) {
      console.error('Error generating workout:', error);
      alert(error.message || 'Errore durante la generazione del piano allenamento');
    } finally {
      setIsGenerating(false);
    }
  };

  const isComplete = userProfile?.subscription_type === 'complete';
  const hasCompletedConsultation = userProfile?.consultation_completed === true;
  const canGenerateWorkout = isComplete && hasCompletedConsultation;
  const showConsultationWarning = isComplete && !hasCompletedConsultation;

  // Giorni consigliati per il workout selezionato (badge nel modal)
  const selectedSuggestedDays = useMemo(() => {
    return selectedWorkout ? extractSuggestedDays(selectedWorkout.description) : [];
  }, [selectedWorkout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-burgundy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">I Tuoi Allenamenti</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Genera piani di allenamento personalizzati dopo la consulenza iniziale
          </p>
        </div>
        <span className="bg-brand-burgundy/10 text-brand-burgundy px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-sm whitespace-nowrap self-start">
          {workouts.length} Schede Disponibili
        </span>
      </div>

      <div className="bg-gradient-to-br from-brand-burgundy to-brand-burgundy-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Genera il tuo Piano Allenamento</h3>
            <p className="text-sm sm:text-base text-white/90 mb-4">
              Crea un piano personalizzato basato sui risultati della consulenza.
              {showConsultationWarning && (
                <span className="block mt-2 text-xs sm:text-sm bg-white/20 rounded-lg p-2 sm:p-3">
                  Per generare un piano allenamento personalizzato, devi prima completare la consulenza iniziale con il nutrizionista.
                </span>
              )}
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-white/90 mb-4">
              <li className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 flex-shrink-0" />
                <span>Piano personalizzato basato sui tuoi obiettivi</span>
              </li>
              <li className="flex items-center space-x-2">
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Allenamenti con video tutorial inclusi</span>
              </li>
              <li className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Progressione graduale e sicura</span>
              </li>
            </ul>
          </div>
        </div>
        <button
          onClick={handleGenerateWorkout}
          disabled={!canGenerateWorkout || isGenerating}
          className="w-full sm:w-auto bg-white text-brand-burgundy px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-brand-burgundy"></div>
              <span>Generazione in corso...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">{canGenerateWorkout ? 'Genera Piano Allenamento' : 'Generazione non disponibile'}</span>
            </>
          )}
        </button>
      </div>

      {workouts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {workouts.map((workout) => {
            const workoutExercises = exercises[workout.id] || [];
            const badge = getWorkoutTypeBadge(workout.workout_type);
            const suggestedDays = extractSuggestedDays(workout.description);

            return (
              <div key={workout.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-medium transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">{badge.emoji}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{workout.title}</h3>
                  </div>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getDifficultyColor(workout.difficulty)} self-start sm:self-auto whitespace-nowrap`}>
                    {workout.difficulty}
                  </span>
                </div>

                {/* Description preview: multiline-friendly but clamped */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3 break-words" style={{ whiteSpace: 'pre-line' }}>
                  {workout.description}
                </p>

                {/* Suggested days preview */}
                {suggestedDays.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                    {suggestedDays.slice(0, 4).map((d, idx) => (
                      <span key={idx} className="bg-brand-burgundy/10 text-brand-burgundy px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Durata:
                    </span>
                    <span className="font-medium">{workout.duration_minutes} min</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Allenamenti:
                    </span>
                    <span className="font-medium">{workoutExercises.length}</span>
                  </div>

                  {workout.target_muscles && workout.target_muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                      {workout.target_muscles.slice(0, 3).map((muscle, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openWorkoutDetail(workout)}
                  className="w-full bg-gradient-to-r from-brand-burgundy to-brand-pink text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Visualizza Scheda</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nessuna Scheda Disponibile</h3>
          <p className="text-gray-600 mb-6">
            Genera il tuo primo piano allenamento personalizzato cliccando sul bottone qui sopra.
          </p>
        </div>
      )}

      {/* Workout Detail Modal */}
      {showDetailModal && selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{selectedWorkout.title}</h2>

                {/* Giorni consigliati come badge */}
                {selectedSuggestedDays.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                    {selectedSuggestedDays.map((d, idx) => (
                      <span key={idx} className="bg-brand-burgundy/10 text-brand-burgundy px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description multiline */}
                <p className="text-sm sm:text-base text-gray-600 break-words" style={{ whiteSpace: 'pre-line' }}>
                  {selectedWorkout.description}
                </p>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Workout Info */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Durata</div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-900">{selectedWorkout.duration_minutes} min</div>
                </div>
                <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Difficoltà</div>
                  <div className="text-lg sm:text-2xl font-bold text-orange-900 capitalize break-words">{selectedWorkout.difficulty}</div>
                </div>
                <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Tipo</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-900 break-words">
                    {getWorkoutTypeBadge(selectedWorkout.workout_type).label}
                  </div>
                </div>
              </div>

              {/* Equipment Needed */}
              {selectedWorkout.equipment_needed && selectedWorkout.equipment_needed.length > 0 && (
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Attrezzatura Necessaria</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedWorkout.equipment_needed.map((equipment, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises List */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Allenamenti ({exercises[selectedWorkout.id]?.length || 0})
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {exercises[selectedWorkout.id]?.map((exercise, idx) => (
                    <div key={exercise.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                        <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-burgundy text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 text-base sm:text-lg break-words">{exercise.exercise_name}</h4>

                            {/* Notes multiline */}
                            {exercise.notes && (
                              <div className="text-xs sm:text-sm text-gray-600 mt-2 break-words" style={{ whiteSpace: 'pre-line' }}>
                                {exercise.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {exercise.video_url && (
                          <a
                            href={exercise.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-brand-burgundy hover:text-brand-pink transition-colors text-xs sm:text-sm font-medium flex-shrink-0 self-start sm:self-auto"
                          >
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Video</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                        {exercise.sets && (
                          <div className="bg-white rounded-lg p-2 sm:p-3">
                            <div className="text-gray-600 mb-1 text-xs">Serie</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-base">{exercise.sets}</div>
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="bg-white rounded-lg p-2 sm:p-3">
                            <div className="text-gray-600 mb-1 text-xs">Ripetizioni</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-base break-words">{exercise.reps}</div>
                          </div>
                        )}
                        {exercise.rest_seconds && (
                          <div className="bg-white rounded-lg p-2 sm:p-3">
                            <div className="text-gray-600 mb-1 text-xs">Recupero</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-base">{exercise.rest_seconds}s</div>
                          </div>
                        )}
                        {exercise.weight_kg && (
                          <div className="bg-white rounded-lg p-2 sm:p-3">
                            <div className="text-gray-600 mb-1 text-xs">Peso</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-base">{exercise.weight_kg} kg</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Micro-copy utile */}
                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 bg-brand-burgundy/5 border border-brand-burgundy/10 rounded-lg sm:rounded-xl p-3 sm:p-4 break-words">
                  Se salti un giorno, sposta semplicemente l'allenamento al giorno successivo: l'importante è mantenere la frequenza settimanale.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsSection;