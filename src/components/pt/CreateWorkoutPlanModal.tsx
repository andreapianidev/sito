import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, FileText, Search, ExternalLink, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ptUserId: string;
  clientUserId?: string;
  clientName?: string;
  clientEmail?: string;
  onSuccess: () => void;
}

interface ClientProfile {
  full_name: string;
  email: string;
}

interface Assessment {
  weight?: number;
  height?: number;
  body_fat_percentage?: number;
  primary_goal?: string;
  target_weight?: number;
  timeline_weeks?: number;
  medical_conditions?: string[];
  food_allergies?: string[];
  activity_level?: string;
  exercise_frequency?: number;
  notes?: string;
}

interface CatalogExercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
}

interface WorkoutExercise {
  exercise_id?: string;
  custom_exercise_name?: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  video_url?: string;
}

const CreateWorkoutPlanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ptUserId,
  clientUserId,
  clientName,
  clientEmail,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  // Anamnesi
  const [assessment, setAssessment] = useState<Assessment>({
    activity_level: 'moderato',
    exercise_frequency: 3
  });

  // Scheda allenamento
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('forza');
  const [difficulty, setDifficulty] = useState('intermedio');
  const [duration, setDuration] = useState(60);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    { name: '', sets: 3, reps: '10-12', rest_seconds: 60 }
  ]);

  // Catalogo esercizi
  const [catalogExercises, setCatalogExercises] = useState<CatalogExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && clientUserId) {
      loadClientData();
      loadCatalogExercises();
    }
  }, [isOpen, clientUserId]);

  const loadClientData = async () => {
    if (!clientUserId) {
      console.log('[PT Modal] No clientUserId provided');
      return;
    }

    console.log('[PT Modal] Loading data for client:', clientUserId);

    try {
      // Load client profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', clientUserId)
        .maybeSingle();

      console.log('[PT Modal] Profile data:', profileData, 'Error:', profileError);

      if (profileError) {
        console.error('[PT Modal] Error loading profile:', profileError);
      }

      if (profileData) {
        setClientProfile(profileData);
      } else {
        console.warn('[PT Modal] No profile found for client:', clientUserId);
      }

      // Load existing assessment (created by nutritionist)
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', clientUserId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[PT Modal] Assessment data:', assessmentData, 'Error:', assessmentError);

      if (assessmentError) {
        console.error('Error loading assessment:', assessmentError);
      } else if (assessmentData) {
        setAssessment(assessmentData);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  const loadCatalogExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('pt_exercises')
        .select('*')
        .or(`pt_user_id.eq.${ptUserId},is_public.eq.true`)
        .order('name');

      if (error) throw error;
      setCatalogExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10-12', rest_seconds: 60 }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSelectCatalogExercise = (exercise: CatalogExercise) => {
    if (selectedExerciseIndex === null) return;

    const newExercises = [...exercises];
    newExercises[selectedExerciseIndex] = {
      ...newExercises[selectedExerciseIndex],
      exercise_id: exercise.id,
      name: exercise.name,
      video_url: exercise.video_url
    };
    setExercises(newExercises);
    setShowExercisePicker(false);
    setSelectedExerciseIndex(null);
    setExerciseSearchTerm('');
  };

  const filteredCatalogExercises = catalogExercises.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
  );


  const handleSaveWorkout = async () => {
    if (!workoutTitle.trim()) {
      alert('Inserisci un titolo per la scheda');
      return;
    }

    if (exercises.some(e => !e.name.trim())) {
      alert('Tutti gli esercizi devono avere un nome');
      return;
    }

    try {
      setLoading(true);

      // Salva la scheda
      const { data: workout, error: workoutError } = await supabase
        .from('pt_workouts')
        .insert([{
          pt_user_id: ptUserId,
          client_user_id: clientUserId,
          title: workoutTitle,
          description: `${exercises.length} esercizi - ${workoutType}`,
          workout_type: workoutType,
          difficulty,
          duration_minutes: duration,
          is_template: false,
          is_public: false
        }])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Salva gli esercizi nella tabella pt_workout_exercises
      const exercisesToInsert = exercises.map((ex, index) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id || null,
        custom_exercise_name: ex.exercise_id ? null : ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: index
      }));

      const { error: exercisesError } = await supabase
        .from('pt_workout_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      alert('Scheda allenamento creata con successo!');
      onSuccess();
      onClose();

      // Reset form
      setStep(1);
      setAssessment({ activity_level: 'moderato', exercise_frequency: 3 });
      setWorkoutTitle('');
      setExercises([{ name: '', sets: 3, reps: '10-12', rest_seconds: 60 }]);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Errore nel salvare la scheda');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayClientName = clientProfile?.full_name || clientName || 'Cliente';
  const displayClientEmail = clientProfile?.email || clientEmail || 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 ? 'Anamnesi Cliente' : 'Crea Scheda Allenamento'}
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-brand-burgundy text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-brand-burgundy text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {clientUserId && !clientProfile && displayClientName === 'Cliente' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Errore:</strong> Profilo cliente non trovato. Il cliente potrebbe essere stato eliminato o il record è corrotto.
                Contatta l'amministratore.
              </p>
            </div>
          )}

          {clientUserId && clientProfile && (
            <div className="mb-6 p-4 bg-brand-light rounded-lg">
              <p className="text-sm text-gray-600">Cliente:</p>
              <p className="font-bold text-gray-900">{displayClientName}</p>
              <p className="text-sm text-gray-600">{displayClientEmail}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> L'anamnesi è creata dalla nutrizionista ed è disponibile qui in sola lettura per riferimento.
                </p>
              </div>

              {!assessment.weight && !assessment.height && !assessment.body_fat_percentage && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Attenzione:</strong> Nessuna anamnesi trovata per questo cliente. La nutrizionista deve prima creare un piano nutrizionale con valutazione iniziale.
                  </p>
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-900">Dati Antropometrici</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                  <input
                    type="number"
                    value={assessment.weight || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Altezza (cm)</label>
                  <input
                    type="number"
                    value={assessment.height || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">% Grasso Corporeo</label>
                  <input
                    type="number"
                    step="0.1"
                    value={assessment.body_fat_percentage || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peso Target (kg)</label>
                  <input
                    type="number"
                    value={assessment.target_weight || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Obiettivo Principale</label>
                <input
                  type="text"
                  value={assessment.primary_goal || 'Non specificato'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Livello di Attività</label>
                <input
                  type="text"
                  value={assessment.activity_level || 'Non specificato'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note Mediche / Allergie</label>
                <textarea
                  value={assessment.notes || 'Nessuna nota'}
                  readOnly
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Avanti - Crea Scheda
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titolo Scheda</label>
                <input
                  type="text"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="es. Scheda Forza Livello 1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  >
                    <option value="forza">Forza</option>
                    <option value="cardio">Cardio</option>
                    <option value="ipertrofia">Ipertrofia</option>
                    <option value="funzionale">Funzionale</option>
                    <option value="mobilita">Mobilità</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficoltà</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durata (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Esercizi</h4>
                  <button
                    onClick={handleAddExercise}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-light text-brand-burgundy rounded-lg hover:bg-brand-burgundy hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Esercizio</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Esercizio {index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedExerciseIndex(index);
                              setShowExercisePicker(true);
                            }}
                            className="text-brand-burgundy hover:text-brand-burgundy/80 text-sm flex items-center space-x-1"
                          >
                            <Search className="w-4 h-4" />
                            <span>Scegli da catalogo</span>
                          </button>
                          {exercises.length > 1 && (
                            <button
                              onClick={() => handleRemoveExercise(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        placeholder="Nome esercizio"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                      />

                      {exercise.video_url && (
                        <div className="flex items-center space-x-2 text-sm text-brand-burgundy">
                          <Video className="w-4 h-4" />
                          <a href={exercise.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center space-x-1">
                            <span>Video tutorial</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Serie</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ripetizioni</label>
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                            placeholder="es. 10-12"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Recupero (sec)</label>
                          <input
                            type="number"
                            value={exercise.rest_seconds}
                            onChange={(e) => handleExerciseChange(index, 'rest_seconds', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Link Video</label>
                          <input
                            type="url"
                            value={exercise.video_url || ''}
                            onChange={(e) => handleExerciseChange(index, 'video_url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={exercise.notes || ''}
                        onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                        placeholder="Note (opzionale)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Indietro
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveWorkout}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Salvataggio...' : 'Salva Scheda'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExercisePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Seleziona Esercizio dal Catalogo</h3>
              <button onClick={() => {
                setShowExercisePicker(false);
                setSelectedExerciseIndex(null);
                setExerciseSearchTerm('');
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={exerciseSearchTerm}
                onChange={(e) => setExerciseSearchTerm(e.target.value)}
                placeholder="Cerca esercizio..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredCatalogExercises.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Nessun esercizio trovato</p>
                  <p className="text-sm mt-2">Crea esercizi nella sezione "Esercizi"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCatalogExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelectCatalogExercise(ex)}
                      className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{ex.name}</h4>
                          {ex.description && (
                            <p className="text-sm text-gray-600 mt-1">{ex.description}</p>
                          )}
                          {ex.muscle_groups && ex.muscle_groups.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ex.muscle_groups.map((mg, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-brand-light text-brand-burgundy rounded">
                                  {mg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {ex.video_url && (
                          <Video className="w-5 h-5 text-brand-burgundy ml-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateWorkoutPlanModal;
