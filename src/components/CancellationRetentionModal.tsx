import React, { useState } from 'react';
import {
  X, XCircle, CheckCircle, RefreshCw, Shield, BarChart3,
  ChefHat, MessageCircle, BookOpen, Heart, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  stripeSubscriptionId: string | null;
  subscriptionType?: string;
  subscriptionEndDate?: string | null;
  onCancelled: () => void;
}

const CURRENT_PRICE = 5.99;
const FUTURE_PRICE = 9.99;

type Step = 1 | 2 | 3 | 4 | 5;

const REASONS = [
  { value: 'prezzo', label: 'Il prezzo è troppo alto' },
  { value: 'uso', label: 'Non lo uso abbastanza' },
  { value: 'menu', label: 'I menù non fanno per me' },
  { value: 'obiettivo', label: 'Ho raggiunto il mio obiettivo' },
  { value: 'autonomia', label: 'Preferisco gestirmi autonomamente' },
  { value: 'altro', label: 'Altro' },
];

const RETENTION_MESSAGES: Record<string, { title: string; body: string }> = {
  prezzo: {
    title: 'Il prezzo che hai oggi non è garantito in futuro',
    body: `Capiamo che il costo sia un fattore importante. Quello che però vogliamo dirti è che il tuo piano attuale è bloccato a €${CURRENT_PRICE.toFixed(2)}/mese — un prezzo che non sarà più disponibile per le nuove iscrizioni. Il prezzo standard passerà presto a €${FUTURE_PRICE.toFixed(2)}/mese. Se cancelli ora e volessi tornare in futuro, non potremmo garantirti di riaverlo.`,
  },
  uso: {
    title: 'L\'utilizzo cresce con il tempo, non sparisce',
    body: `Molte utenti attraversano fasi in cui usano meno la piattaforma — è normale, specialmente nei mesi di transizione. Il tuo piano è attivo a €${CURRENT_PRICE.toFixed(2)}/mese: meno di un caffè al giorno. Se cancelli, perdi anche il prezzo bloccato. Il prezzo standard sarà €${FUTURE_PRICE.toFixed(2)}/mese in caso di rientro.`,
  },
  menu: {
    title: 'I menù possono essere migliorati per te',
    body: `Sappiamo che non sempre riusciamo a centrare le preferenze di ogni persona. Il tuo feedback è però prezioso: ci permette di migliorare i prossimi piani. Tieni presente che se cancelli ora, perdi il prezzo bloccato a €${CURRENT_PRICE.toFixed(2)}/mese. Il prezzo standard per rientrare sarà €${FUTURE_PRICE.toFixed(2)}/mese.`,
  },
  obiettivo: {
    title: 'Raggiungere l\'obiettivo è solo l\'inizio',
    body: `Complimenti davvero — è un traguardo importante. Ma il mantenimento è spesso la parte più difficile del percorso. Avere un supporto strutturato può fare la differenza nei mesi successivi. Considera che il tuo piano attuale è a €${CURRENT_PRICE.toFixed(2)}/mese, e in caso di rientro il prezzo standard sarà €${FUTURE_PRICE.toFixed(2)}/mese.`,
  },
  autonomia: {
    title: 'L\'autonomia e il supporto non si escludono',
    body: `È bello sentirsi pronte a gestire tutto da sole. Tieni però presente che avere un punto di riferimento strutturato può aiutare anche nei momenti di incertezza. Il tuo piano è attivo a €${CURRENT_PRICE.toFixed(2)}/mese — un prezzo bloccato che non sarà più disponibile se cancelli. Il nuovo prezzo standard sarà €${FUTURE_PRICE.toFixed(2)}/mese.`,
  },
  altro: {
    title: 'Ci dispiace non aver capito cosa non ha funzionato',
    body: `Qualunque sia il motivo, vogliamo che tu sappia che il tuo prezzo attuale è bloccato a €${CURRENT_PRICE.toFixed(2)}/mese. In caso di rientro futuro, il prezzo standard sarà €${FUTURE_PRICE.toFixed(2)}/mese e non potremo garantirti di riaverlo.`,
  },
};

const STEP_LABELS = ['Motivo', 'Dettagli', 'Prima di procedere', 'Riflessione', 'Conferma'];

const BENEFITS = [
  { icon: ChefHat, label: 'Menù settimanali personalizzati' },
  { icon: Shield, label: 'Accesso completo alla piattaforma' },
  { icon: BarChart3, label: 'Tracking dei progressi' },
  { icon: BookOpen, label: 'Diario alimentare' },
  { icon: Heart, label: 'Contenuti inclusi nel piano' },
];

// ── Step 2 question configs ──────────────────────────────────────────────────

type QuestionType = 'radio' | 'checkbox' | 'textarea';

interface Step2Config {
  question: string;
  type: QuestionType;
  options?: string[];
}

const STEP2_CONFIG: Record<string, Step2Config> = {
  prezzo: {
    question: 'Quanto saresti disposta a pagare per un servizio simile al mese?',
    type: 'radio',
    options: ['Meno di €3', '€3–5', '€5–8', 'Più di €8'],
  },
  uso: {
    question: "Quante volte hai aperto l'app nell'ultimo mese?",
    type: 'radio',
    options: ['Mai', '1–2 volte', '3–5 volte', 'Quasi ogni settimana'],
  },
  menu: {
    question: 'Cosa non ti ha convinto dei menù?',
    type: 'checkbox',
    options: [
      'Ingredienti che non mi piacciono',
      'Troppo complessi',
      'Troppo ripetitivi',
      'Porzioni non adatte',
      'Altro',
    ],
  },
  obiettivo: {
    question: 'Quale obiettivo hai raggiunto?',
    type: 'radio',
    options: ['Peso target', 'Migliori abitudini alimentari', 'Maggiore energia', 'Altro'],
  },
  autonomia: {
    question: 'Hai tutto quello che ti serve per continuare da sola?',
    type: 'radio',
    options: [
      'Sì, ho esperienza',
      'Preferisco usare app gratuite',
      'Voglio fermarmi temporaneamente',
      'Non sono sicura',
    ],
  },
  altro: {
    question: 'Raccontaci di più, ci aiuta a migliorare.',
    type: 'textarea',
  },
};

const AFTER_OPTIONS = [
  'Proverò a gestirmi da sola',
  'Tornerò più avanti',
  'Userò un\'altra soluzione',
  'Non lo so ancora',
];

// ── Component ────────────────────────────────────────────────────────────────

const CancellationRetentionModal = ({
  isOpen, onClose, userId, stripeSubscriptionId,
  subscriptionType, subscriptionEndDate, onCancelled,
}: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [reason, setReason] = useState('');

  // Step 2 answers
  const [step2Radio, setStep2Radio] = useState('');
  const [step2Checkboxes, setStep2Checkboxes] = useState<string[]>([]);
  const [step2Text, setStep2Text] = useState('');

  // Step 4 answers
  const [afterOption, setAfterOption] = useState('');
  const [afterText, setAfterText] = useState('');

  // Step 5
  const [cancelConfirmText, setCancelConfirmText] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const step2Config = reason ? STEP2_CONFIG[reason] : null;
  const retention = reason ? RETENTION_MESSAGES[reason] : null;

  // Validation per step
  const step2Valid = (() => {
    if (!step2Config) return false;
    if (step2Config.type === 'radio') return !!step2Radio;
    if (step2Config.type === 'checkbox') return step2Checkboxes.length > 0;
    if (step2Config.type === 'textarea') return step2Text.trim().length >= 5;
    return false;
  })();

  const step4Valid = !!afterOption;
  const step5Valid = cancelConfirmText === 'CANCELLA';

  const resetAndClose = () => {
    setStep(1);
    setReason('');
    setStep2Radio('');
    setStep2Checkboxes([]);
    setStep2Text('');
    setAfterOption('');
    setAfterText('');
    setCancelConfirmText('');
    setLoading(false);
    onClose();
  };

  const buildCustomReason = () => {
    const step2Answer = step2Config?.type === 'checkbox'
      ? step2Checkboxes.join(', ')
      : step2Config?.type === 'textarea'
        ? step2Text.trim()
        : step2Radio;

    return JSON.stringify({
      reason_label: REASONS.find(r => r.value === reason)?.label,
      step2_question: step2Config?.question,
      step2_answer: step2Answer,
      step4_after: afterOption,
      step4_notes: afterText.trim() || null,
    });
  };

  const saveFeedback = async (opts: {
    offerAccepted: boolean;
    action: 'kept_subscription' | 'cancelled';
    confirmed: boolean;
  }) => {
    try {
      await supabase.from('subscription_cancellation_feedback').insert({
        user_id: userId,
        subscription_id: stripeSubscriptionId ?? null,
        reason: REASONS.find(r => r.value === reason)?.label ?? reason,
        custom_reason: buildCustomReason(),
        subscription_type: subscriptionType ?? null,
        retention_step_shown: true,
        retention_offer_type: reason,
        retention_offer_accepted: opts.offerAccepted,
        retention_action: opts.action,
        current_price: CURRENT_PRICE,
        future_price: FUTURE_PRICE,
        legacy_price_warning_shown: true,
        cancelled_confirmed: opts.confirmed,
      });
    } catch (err) {
      console.error('Error saving cancellation feedback:', err);
    }
  };

  const handleKeep = async () => {
    await saveFeedback({ offerAccepted: true, action: 'kept_subscription', confirmed: false });
    resetAndClose();
  };

  const handleConfirmCancel = async () => {
    try {
      setLoading(true);
      await saveFeedback({ offerAccepted: false, action: 'cancelled', confirmed: true });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non autenticato');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Errore nella cancellazione');

      resetAndClose();
      onCancelled();
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckbox = (val: string) => {
    setStep2Checkboxes(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const endDateFormatted = subscriptionEndDate
    ? new Date(subscriptionEndDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Shared classes ──────────────────────────────────────────────────────────
  const radioClass = (selected: boolean) =>
    `flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
      selected
        ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-sm'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`;

  const keepBtn = (onClick: () => void, label = 'Mantieni il mio abbonamento') => (
    <button
      onClick={onClick}
      className="w-full bg-brand-burgundy hover:bg-brand-burgundy-dark text-white py-4 px-6 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
    >
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      {label}
    </button>
  );

  const proceedLink = (onClick: () => void, label = 'Procedi comunque con la cancellazione') => (
    <button
      onClick={onClick}
      className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors underline underline-offset-2"
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Progress bar */}
        <div className="flex-shrink-0 px-6 pt-5 pb-0">
          <div className="flex items-center gap-1.5 mb-1">
            {([1, 2, 3, 4, 5] as Step[]).map((s) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-colors duration-300 ${s <= step ? 'bg-brand-burgundy' : 'bg-gray-100'}`} />
                <span className={`text-[10px] hidden sm:block transition-colors ${s <= step ? 'text-brand-burgundy font-medium' : 'text-gray-300'}`}>
                  {STEP_LABELS[s - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy mb-2">Prima di andare via</p>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">Ci dispiace vederti andare via 💛</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">
                    Ogni percorso è diverso e capire cosa non ha funzionato ci aiuta a migliorare davvero l'esperienza per tutte.
                  </p>
                </div>
                <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Perché vuoi cancellare l'abbonamento?</p>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label key={r.value} className={radioClass(reason === r.value)}>
                      <input
                        type="radio" name="cancel-reason" value={r.value}
                        checked={reason === r.value}
                        onChange={() => { setReason(r.value); setStep2Radio(''); setStep2Checkboxes([]); setStep2Text(''); }}
                        className="accent-brand-burgundy w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 font-medium">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!reason}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-6 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continua
                </button>
                <button onClick={resetAndClose} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  Torna indietro
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && step2Config && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy mb-2">Approfondimento</p>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">Vorremmo capire meglio</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">
                    Le tue risposte ci aiutano a capire cosa possiamo migliorare, nei menù e nell'esperienza generale.
                  </p>
                  <p className="text-gray-400 mt-1 text-sm italic">
                    Non vogliamo convincerti a restare a tutti i costi. Vorremmo solo capire dove abbiamo sbagliato.
                  </p>
                </div>
                <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">{step2Config.question}</p>

                {step2Config.type === 'radio' && (
                  <div className="space-y-2">
                    {step2Config.options!.map((opt) => (
                      <label key={opt} className={radioClass(step2Radio === opt)}>
                        <input
                          type="radio" name="step2-radio" value={opt}
                          checked={step2Radio === opt}
                          onChange={() => setStep2Radio(opt)}
                          className="accent-brand-burgundy w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {step2Config.type === 'checkbox' && (
                  <div className="space-y-2">
                    {step2Config.options!.map((opt) => (
                      <label key={opt} className={radioClass(step2Checkboxes.includes(opt))}>
                        <input
                          type="checkbox" value={opt}
                          checked={step2Checkboxes.includes(opt)}
                          onChange={() => toggleCheckbox(opt)}
                          className="accent-brand-burgundy w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {step2Config.type === 'textarea' && (
                  <textarea
                    value={step2Text}
                    onChange={(e) => setStep2Text(e.target.value)}
                    placeholder="Scrivi qui il tuo feedback..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-burgundy focus:border-transparent resize-none"
                  />
                )}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-6 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continua
                </button>
                <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  ← Torna al passaggio precedente
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && retention && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy mb-2">Prima di confermare</p>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">Prima di confermare...</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">
                    Abbiamo visto tante utenti interrompere il percorso troppo presto e poi tornare qualche mese dopo. Per questo vogliamo mostrarti un'ultima possibilità prima della cancellazione.
                  </p>
                </div>
                <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-amber-900">{retention.title}</p>
                <p className="text-sm text-amber-800 leading-relaxed">{retention.body}</p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 bg-white rounded-xl p-3 text-center border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium mb-0.5">Prezzo attuale</p>
                    <p className="text-xl font-bold text-amber-900">€{CURRENT_PRICE.toFixed(2)}<span className="text-sm font-normal">/mese</span></p>
                  </div>
                  <div className="text-amber-400 font-bold">→</div>
                  <div className="flex-1 bg-white rounded-xl p-3 text-center border border-red-200">
                    <p className="text-xs text-red-500 font-medium mb-0.5">Prezzo futuro</p>
                    <p className="text-xl font-bold text-red-600">€{FUTURE_PRICE.toFixed(2)}<span className="text-sm font-normal">/mese</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "Il tuo percorso non deve essere perfetto per funzionare. A volte basta solo rallentare, non ricominciare da zero."
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {keepBtn(handleKeep)}
                {proceedLink(() => setStep(4))}
              </div>
            </>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy mb-2">Riflessione</p>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">Sei davvero sicura?</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">
                    Prima di chiudere il tuo percorso, fermati un momento a pensare a cosa succederà dopo.
                  </p>
                  <p className="text-gray-400 mt-1 text-sm italic">
                    Molte persone cancellano nei momenti di stanchezza e poi fanno fatica a ripartire. Vorremmo solo aiutarti a prendere una decisione consapevole.
                  </p>
                </div>
                <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Cosa pensi di fare dopo aver cancellato?</p>
                <div className="space-y-2">
                  {AFTER_OPTIONS.map((opt) => (
                    <label key={opt} className={radioClass(afterOption === opt)}>
                      <input
                        type="radio" name="after-option" value={opt}
                        checked={afterOption === opt}
                        onChange={() => setAfterOption(opt)}
                        className="accent-brand-burgundy w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Vuoi aggiungere qualcosa? <span className="text-gray-400 font-normal">(opzionale)</span></label>
                <textarea
                  value={afterText}
                  onChange={(e) => setAfterText(e.target.value)}
                  placeholder="Scrivilo qui..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-burgundy focus:border-transparent resize-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                {keepBtn(handleKeep)}
                <button
                  onClick={() => setStep(5)}
                  disabled={!step4Valid}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors underline underline-offset-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Procedi comunque con la cancellazione
                </button>
              </div>
            </>
          )}

          {/* ── STEP 5 ── */}
          {step === 5 && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-burgundy mb-2">Conferma finale</p>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">Ultimo passaggio</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">
                    Una volta cancellato perderai il prezzo attuale bloccato e alcune funzionalità del percorso. Sei ancora in tempo per mantenere il tuo piano attivo.
                  </p>
                  <p className="text-gray-400 mt-1 text-sm italic">
                    Ci piacerebbe continuare questo percorso con te. Ma se questa è davvero la scelta giusta per te, puoi confermare qui sotto.
                  </p>
                </div>
                <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Access + price info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {endDateFormatted && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Accesso garantito fino a</p>
                    <p className="text-base font-bold text-blue-900">{endDateFormatted}</p>
                  </div>
                )}
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">Perdi il prezzo bloccato</p>
                  <p className="text-base font-bold text-red-700">
                    €{CURRENT_PRICE.toFixed(2)} → €{FUTURE_PRICE.toFixed(2)}/mese
                  </p>
                </div>
              </div>

              {/* Benefits list */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Cosa perderai</p>
                </div>
                <ul className="space-y-3">
                  {BENEFITS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirm field */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Per confermare scrivi <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-mono">CANCELLA</span> nel campo qui sotto
                </label>
                <p className="text-xs text-gray-400 mb-3">Questo passaggio serve a confermare che la scelta è consapevole.</p>
                <input
                  type="text"
                  value={cancelConfirmText}
                  onChange={(e) => setCancelConfirmText(e.target.value)}
                  placeholder="Scrivi CANCELLA per procedere"
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                    step5Valid
                      ? 'border-red-400 bg-red-50 focus:ring-red-300 text-red-700'
                      : 'border-gray-200 focus:ring-brand-burgundy'
                  }`}
                />
              </div>

              <div className="space-y-3 pt-2">
                {keepBtn(handleKeep)}
                <button
                  onClick={handleConfirmCancel}
                  disabled={!step5Valid || loading}
                  className="w-full bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-400 py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Cancellazione in corso...</>
                  ) : (
                    <><XCircle className="w-4 h-4" />Cancella definitivamente</>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CancellationRetentionModal;
