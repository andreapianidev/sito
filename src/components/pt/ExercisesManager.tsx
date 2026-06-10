import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, Video, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
  is_public: boolean;
}

interface Props {
  ptUserId: string;
}

const ExercisesManager: React.FC<Props> = ({ ptUserId }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    video_url: '',
    muscle_groups: [] as string[],
    equipment: [] as string[],
    difficulty: 'intermedio',
    is_public: false
  });

  useEffect(() => {
    loadExercises();
  }, [ptUserId]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pt_exercises')
        .select('*')
        .eq('pt_user_id', ptUserId)
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExercise = async () => {
    if (!formData.name.trim()) {
      alert('Inserisci il nome dell\'esercizio');
      return;
    }

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from('pt_exercises')
          .update(formData)
          .eq('id', editingExercise.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pt_exercises')
          .insert([{
            ...formData,
            pt_user_id: ptUserId
          }]);

        if (error) throw error;
      }

      await loadExercises();
      handleCloseModal();
      alert(editingExercise ? 'Esercizio aggiornato!' : 'Esercizio creato!');
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Errore nel salvare l\'esercizio');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return;

    try {
      const { error } = await supabase
        .from('pt_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadExercises();
      alert('Esercizio eliminato!');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Errore nell\'eliminare l\'esercizio');
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      video_url: exercise.video_url || '',
      muscle_groups: exercise.muscle_groups || [],
      equipment: exercise.equipment || [],
      difficulty: exercise.difficulty || 'intermedio',
      is_public: exercise.is_public
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingExercise(null);
    setFormData({
      name: '',
      description: '',
      video_url: '',
      muscle_groups: [],
      equipment: [],
      difficulty: 'intermedio',
      is_public: false
    });
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const muscleGroupOptions = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Addominali', 'Glutei'];
  const equipmentOptions = ['Bilanciere', 'Manubri', 'Macchina', 'Corpo Libero', 'Kettlebell', 'Elastici', 'TRX'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 mr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca esercizi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuovo Esercizio</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Caricamento...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nessun esercizio trovato</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-brand-burgundy hover:underline"
          >
            Crea il tuo primo esercizio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                  {exercise.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{exercise.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button
                    onClick={() => handleEditExercise(exercise)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(exercise.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {exercise.muscle_groups.map((mg, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-brand-light text-brand-burgundy rounded">
                      {mg}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                <span className="capitalize">{exercise.difficulty}</span>
                {exercise.video_url && (
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-brand-burgundy hover:underline"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {exercise.is_public && (
                <div className="mt-2 text-xs text-green-600">✓ Pubblico</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Esercizio *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="es. Panca Piana Bilanciere"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="Descrivi l'esecuzione corretta dell'esercizio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Video (YouTube, Vimeo, etc.)</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gruppi Muscolari</label>
                <div className="flex flex-wrap gap-2">
                  {muscleGroupOptions.map((mg) => (
                    <button
                      key={mg}
                      onClick={() => {
                        const current = formData.muscle_groups;
                        setFormData({
                          ...formData,
                          muscle_groups: current.includes(mg)
                            ? current.filter(m => m !== mg)
                            : [...current, mg]
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.muscle_groups.includes(mg)
                          ? 'bg-brand-burgundy text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attrezzatura</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => {
                        const current = formData.equipment;
                        setFormData({
                          ...formData,
                          equipment: current.includes(eq)
                            ? current.filter(e => e !== eq)
                            : [...current, eq]
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.equipment.includes(eq)
                          ? 'bg-brand-burgundy text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficoltà</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzato">Avanzato</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="w-4 h-4 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  Rendi pubblico (visibile ad altri PT)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveExercise}
                  className="flex items-center space-x-2 px-6 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingExercise ? 'Salva Modifiche' : 'Crea Esercizio'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisesManager;
