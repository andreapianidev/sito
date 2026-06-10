import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Mail, Phone, User, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface RestartQuizProps {
  onBack: () => void;
}

const RestartQuiz: React.FC<RestartQuizProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = contact form, 2-5 = questions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Contact Info
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Step 2-5: Quiz Answers
  const [answers, setAnswers] = useState({
    goal: '',
    consistency: '',
    motivation: '',
    budget: ''
  });

  const questions = [
    {
      id: 'goal',
      question: 'Qual è il tuo traguardo principale?',
      options: [
        { value: 'weight_loss', label: 'Perdere 5-15kg e tonificare' },
        { value: 'emotional_eating', label: 'Gestire la fame nervosa e le abbuffate' },
        { value: 'healthy_eating', label: 'Sgonfiarmi e imparare a mangiare sano' }
      ]
    },
    {
      id: 'consistency',
      question: 'Quante volte hai iniziato una dieta per poi mollarla dopo poco?',
      options: [
        { value: 'never', label: 'Mai, sono sempre costante' },
        { value: 'sometimes', label: 'Qualche volta, quando lo stress aumenta' },
        { value: 'always', label: 'Sempre, perdo subito la motivazione' }
      ]
    },
    {
      id: 'motivation',
      question: 'Quanto sei pronta ad impegnarti seriamente per cambiare il tuo corpo nei prossimi 90 giorni?',
      options: [
        { value: 'high', label: 'Voglio una trasformazione totale, ora' },
        { value: 'medium', label: 'Mi piacerebbe, ma ho paura di non farcela' },
        { value: 'low', label: 'Voglio solo qualche consiglio per iniziare con calma' }
      ]
    },
    {
      id: 'budget',
      question: 'Per un percorso d\'eccellenza di 3 mesi con Nutrizionista, Psicologa, Supporto giornaliero e Integratori inclusi, quale investimento puoi sostenere per la tua salute?',
      options: [
        { value: 'low', label: 'Tra 50€ e 200€' },
        { value: 'medium', label: 'Tra 200€ e 400€' },
        { value: 'high', label: 'Oltre 400€' }
      ]
    }
  ];

  const calculateOutcome = () => {
    const { motivation, budget } = answers;

    // ESITO A: "CANDIDATA IDEALE" (Il Percorso da 370€)
    // Budget medio/alto + Motivazione alta/media
    if ((budget === 'medium' || budget === 'high') && (motivation === 'high' || motivation === 'medium')) {
      return 'ideal_candidate';
    }

    // ESITO C: "VISITA BASIC" (Il Piano da 95€)
    // Budget basso MA motivazione altissima
    if (budget === 'low' && motivation === 'high') {
      return 'basic_visit';
    }

    // ESITO B: "RESTART LIGHT" (L'Abbonamento a 5,99€)
    // Budget basso O Motivazione bassa
    return 'restart_light';
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contactInfo.name.trim() || !contactInfo.email.trim()) {
      setError('Nome ed email sono obbligatori');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      setError('Inserisci un\'email valida');
      return;
    }

    setStep(2); // Move to first question
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[step - 2];
    if (currentQuestion && !answers[currentQuestion.id as keyof typeof answers]) {
      setError('Seleziona una risposta per continuare');
      return;
    }
    setError('');

    if (step < 5) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const outcome = calculateOutcome();

      // Save to database
      const { error: dbError } = await supabase
        .from('restart_leads')
        .insert({
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone || null,
          goal: answers.goal,
          consistency: answers.consistency,
          motivation: answers.motivation,
          budget: answers.budget,
          outcome: outcome
        });

      if (dbError) {
        console.error('Error saving lead:', dbError);
        // Don't block user if DB save fails
      }

      // Navigate to result page
      navigate(`/restart-result?outcome=${outcome}&email=${encodeURIComponent(contactInfo.email)}`);

    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError('Errore nel salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestionIndex = step - 2;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-burgundy via-brand-burgundy-dark to-brand-pink flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white text-sm mb-2">
            <span>Progresso</span>
            <span>{step} di 5</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-brand-burgundy mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Indietro</span>
          </button>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Contact Form */}
          {step === 1 && (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Prima di scoprire se il Metodo Restart è adatto a te...
                </h2>
                <p className="text-lg text-gray-600">
                  Dicci chi sei per ricevere il risultato del test personalizzato
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    placeholder="Es: Maria Rossi"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    placeholder="la-tua-email@esempio.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero di Telefono (Opzionale)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Per ricevere il risultato anche via WhatsApp</p>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-burgundy text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-burgundy-dark transition-colors flex items-center justify-center space-x-2"
              >
                <span>INIZIA IL TEST</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-center text-gray-500">
                I tuoi dati sono protetti e non verranno condivisi con terzi
              </p>
            </form>
          )}

          {/* STEP 2-5: Questions */}
          {step >= 2 && step <= 5 && currentQuestion && (
            <div className="space-y-8">
              <div>
                <div className="inline-block bg-brand-burgundy/10 text-brand-burgundy px-3 py-1 rounded-full text-sm font-bold mb-4">
                  Domanda {currentQuestionIndex + 1} di 4
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id as keyof typeof answers] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                      className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-lg'
                          : 'border-gray-200 hover:border-brand-burgundy/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg ${isSelected ? 'font-bold text-brand-burgundy' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-brand-burgundy flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                disabled={loading || !answers[currentQuestion.id as keyof typeof answers]}
                className="w-full bg-brand-burgundy text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <span>{step === 5 ? 'SCOPRI IL TUO RISULTATO' : 'CONTINUA'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-white text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>100% Riservato</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>2 minuti</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Risultato Immediato</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestartQuiz;
