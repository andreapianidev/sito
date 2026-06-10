import { useState } from 'react';
import { X, Star, ChevronRight, Check, Smile, Meh, Frown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WeeklyMenuFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  userId: string;
  weeklyMenuId: string;
}

export default function WeeklyMenuFeedback({
  isOpen,
  onClose,
  onSubmit,
  userId,
  weeklyMenuId
}: WeeklyMenuFeedbackProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [feedback, setFeedback] = useState({
    overall_rating: 0,
    complexity_feedback: '',
    speed_preference: '',
    breakfast_preference_update: '',
    additional_dislikes: [] as string[],
    notes: '',
  });

  const complexityOptions = [
    { value: 'too_complex', label: 'Troppo Complesse', icon: Frown, color: 'orange' },
    { value: 'just_right', label: 'Perfette', icon: Smile, color: 'green' },
    { value: 'can_be_more', label: 'Possono Essere Più Elaborate', icon: Meh, color: 'blue' },
  ];

  const speedOptions = [
    { value: 'faster', label: 'Più Veloci (< 30 min)' },
    { value: 'balanced', label: 'Bilanciato (va bene così)' },
    { value: 'elaborate', label: 'Più Elaborate (no problem)' },
  ];

  const breakfastOptions = [
    { value: '', label: 'Nessuna Modifica' },
    { value: 'dolce', label: '🥐 Preferisco Dolce' },
    { value: 'salata', label: '🥖 Preferisco Salata' },
    { value: 'mix', label: '🍳 Alternare Dolce/Salata' },
  ];

  const commonDislikes = [
    'Pesce', 'Frutti di mare', 'Funghi', 'Verdure crude',
    'Legumi', 'Formaggio', 'Spezie piccanti', 'Cipolla/Aglio'
  ];

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('menu_feedback')
        .insert({
          user_id: userId,
          weekly_menu_id: weeklyMenuId,
          overall_rating: feedback.overall_rating,
          complexity_feedback: feedback.complexity_feedback,
          speed_preference: feedback.speed_preference,
          breakfast_preference_update: feedback.breakfast_preference_update || null,
          additional_dislikes: feedback.additional_dislikes,
          notes: feedback.notes,
        });

      if (error) throw error;

      // If user updated breakfast preference, update it in user_assessments too
      if (feedback.breakfast_preference_update) {
        const { data: latestAssessment } = await supabase
          .from('user_assessments')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestAssessment) {
          await supabase
            .from('user_assessments')
            .update({ breakfast_preference: feedback.breakfast_preference_update })
            .eq('id', latestAssessment.id);
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        onSubmit();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving feedback:', err);
      alert('Errore nel salvataggio del feedback');
      setLoading(false);
    }
  };

  const toggleDislikes = (item: string) => {
    if (feedback.additional_dislikes.includes(item)) {
      setFeedback({
        ...feedback,
        additional_dislikes: feedback.additional_dislikes.filter(i => i !== item)
      });
    } else {
      setFeedback({
        ...feedback,
        additional_dislikes: [...feedback.additional_dislikes, item]
      });
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Grazie per il Feedback!
          </h3>
          <p className="text-gray-600">
            Useremo le tue indicazioni per creare un menù ancora più adatto a te la prossima settimana.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Come è andata questa settimana?
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Aiutaci a migliorare il tuo prossimo menù
            </p>
          </div>
          <button
            onClick={() => {
              onSubmit();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Come valuti i menù di questa settimana?
                </label>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedback({ ...feedback, overall_rating: rating })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 ${
                          rating <= feedback.overall_rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {feedback.overall_rating === 0 && 'Seleziona un voto'}
                  {feedback.overall_rating === 1 && 'Non mi è piaciuto'}
                  {feedback.overall_rating === 2 && 'Potrebbe migliorare'}
                  {feedback.overall_rating === 3 && 'Buono'}
                  {feedback.overall_rating === 4 && 'Molto buono'}
                  {feedback.overall_rating === 5 && 'Eccellente!'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Le ricette erano...
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {complexityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFeedback({ ...feedback, complexity_feedback: option.value })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          feedback.complexity_feedback === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${
                          feedback.complexity_feedback === option.value
                            ? `text-${option.color}-600`
                            : 'text-gray-400'
                        }`} />
                        <div className="text-xs font-medium text-center">
                          {option.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Per le prossime ricette preferisci...
                </label>
                <div className="space-y-2">
                  {speedOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFeedback({ ...feedback, speed_preference: option.value })}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                        feedback.speed_preference === option.value
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {feedback.speed_preference === option.value && (
                          <Check className="h-5 w-5 text-rose-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vuoi cambiare la preferenza per le colazioni?
                </label>
                <div className="space-y-2">
                  {breakfastOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFeedback({ ...feedback, breakfast_preference_update: option.value })}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                        feedback.breakfast_preference_update === option.value
                          ? 'border-teal-500 bg-teal-50 text-teal-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {feedback.breakfast_preference_update === option.value && (
                          <Check className="h-5 w-5 text-teal-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vuoi escludere altri alimenti? (opzionale)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {commonDislikes.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleDislikes(item)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        feedback.additional_dislikes.includes(item)
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note aggiuntive (opzionale)
                </label>
                <textarea
                  value={feedback.notes}
                  onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                  placeholder="Es: vorrei più ricette con..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3 rounded-b-2xl">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Indietro
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => {
                if (feedback.overall_rating === 0) {
                  alert('Seleziona un voto prima di continuare');
                  return;
                }
                setStep(2);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              Continua
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Invio...' : 'Invia Feedback'}
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
