import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, ClipboardList, ChefHat, BookOpen, Calendar, TrendingUp } from 'lucide-react';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNavigate: (tab: string) => void;
}

const steps = [
  {
    id: 1,
    icon: ClipboardList,
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBg: 'bg-orange-500',
    tab: 'overview',
    title: 'Compila il Questionario',
    description: 'Il primo passo fondamentale! Nella sezione Panoramica trovi il questionario iniziale: ci racconta le tue preferenze alimentari, eventuali allergie e i tuoi obiettivi.',
    hint: 'Senza questionario non è possibile generare menù personalizzati.',
    cta: 'Vai a Panoramica',
  },
  {
    id: 2,
    icon: ChefHat,
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    tab: 'weekly-menu',
    title: 'Genera il tuo Menù Settimanale',
    description: 'Nella sezione Menù Settimanali puoi generare un menù personalizzato per tutta la settimana, basato sulle tue risposte al questionario.',
    hint: 'I menù vengono aggiornati ogni settimana con ricette bilanciate e varie.',
    cta: 'Vai ai Menù Settimanali',
  },
  {
    id: 3,
    icon: BookOpen,
    color: 'from-sky-400 to-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    iconBg: 'bg-sky-500',
    tab: 'recipes',
    title: 'Sezione Ricette',
    description: 'Sfoglia le ricette della tua area personale: ingredienti, procedimento, valori nutrizionali e molto altro. Ogni piatto è pensato per i tuoi obiettivi.',
    hint: 'Le ricette sono filtrate in base alle tue preferenze alimentari.',
    cta: 'Vai alle Ricette',
  },
  {
    id: 4,
    icon: Calendar,
    color: 'from-violet-400 to-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    iconBg: 'bg-violet-500',
    tab: 'food-diary',
    title: 'Diario Settimanale',
    description: 'Nel Diario Alimentare puoi registrare i pasti giornalieri e tenere traccia di ciò che mangi durante la settimana.',
    hint: 'Registrare i pasti aiuta a restare consapevoli e raggiungere prima gli obiettivi.',
    cta: 'Vai al Diario',
  },
  {
    id: 5,
    icon: TrendingUp,
    color: 'from-rose-400 to-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-500',
    tab: 'progress',
    title: 'Progressi',
    description: 'Nella sezione Progressi puoi inserire le tue misure corporee e monitorare l\'evoluzione nel tempo con grafici e statistiche.',
    hint: 'Aggiorna le misure regolarmente per vedere i tuoi miglioramenti.',
    cta: 'Vai ai Progressi',
  },
];

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onClose, onComplete, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNavigate = () => {
    onNavigate(step.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${step.color}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Benvenuto
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 px-6 pb-4">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? `w-8 bg-gradient-to-r ${step.color}`
                  : i < currentStep
                  ? 'w-4 bg-gray-300'
                  : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Icon + step label */}
          <div className={`${step.bgColor} ${step.borderColor} border rounded-2xl p-6 mb-5`}>
            <div className="flex items-start gap-4">
              <div className={`${step.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Step {step.id} di {steps.length}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
                <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2 mb-6 px-1">
            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 italic">{step.hint}</p>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {/* Back */}
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              disabled={isFirst}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isFirst
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>

            {/* Go to section */}
            <button
              onClick={handleNavigate}
              className={`flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${step.color} text-white hover:opacity-90 transition-opacity shadow-sm`}
            >
              {step.cta}
            </button>

            {/* Next / Complete */}
            {isLast ? (
              <button
                onClick={onComplete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                Fine
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Avanti
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
