import React, { useEffect, useMemo, useState } from 'react';
import { Target, Heart, Calendar, MessageSquare, TrendingUp, Apple, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CoachingJourneyViewProps {
  userId: string;
}

type PreConsultationState = 'NEEDS_BOOKING' | 'BOOKED_WAITING' | 'NONE';

const toDateOnlyLocal = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

const diffDaysInclusive = (end: Date, now: Date) => {
  const endDay = toDateOnlyLocal(end).getTime();
  const nowDay = toDateOnlyLocal(now).getTime();
  return Math.max(0, Math.ceil((endDay - nowDay) / (1000 * 60 * 60 * 24)));
};

const parseTimestamptzToDate = (value: string) => {
  // supporta "2026-05-20 12:15:34.186+00" e ISO
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return new Date(normalized);
};

const formatDateIT = (d: Date) =>
  d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Combina date + time (time without tz) in una Date locale
const combineDateTimeLocal = (dateStr: string, timeStr?: string | null) => {
  // dateStr: YYYY-MM-DD
  // timeStr: HH:MM:SS o HH:MM
  const t = (timeStr || '00:00:00').length === 5 ? `${timeStr}:00` : (timeStr || '00:00:00');
  return new Date(`${dateStr}T${t}`);
};

/**
 * ==========================
 * PRINCIPI GUIDA (CARD VISIVE)
 * ==========================
 * Ogni card ha uno slot immagine (imageUrl) da riempire con link a schemi/immagini.
 */
type PrincipleCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  bullets: string[];
  examples?: { bad: string; good: string }[];
  takeaway?: string;
  imageUrl?: string;
  imageAlt?: string;
  // keywords per dedupe con coaching_principles provenienti dal DB
  keywords?: string[];
};

const normalizeText = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const includesAnyKeyword = (text: string, keywords: string[]) => {
  const t = normalizeText(text);
  return keywords.some((k) => t.includes(normalizeText(k)));
};

const defaultRestartPrinciplesCards: PrincipleCard[] = [
  {
  id: 'plate',
  title: 'Il piatto bilanciato (senza bilancia)',
  subtitle: 'Regola base per ogni pasto principale',
  icon: <Target className="w-5 h-5 text-purple-700" />,
  gradient: 'from-purple-50 to-pink-50',
  border: 'border-purple-200',
  bullets: [
    '½ verdure • ¼ proteine • ¼ carboidrati (quando previsti)',
    'Grassi buoni: presenti ma dosati',
    'Se manca un pezzo, spesso torna fame prima',
  ],
  takeaway: 'Piatto completo = controllo senza grammature.',
  imageUrl: 'https://hjmecstedaibgmdawbtp.supabase.co/storage/v1/object/public/varie/piatto%20sano.png',
  imageAlt: 'Schema piatto bilanciato',
  keywords: ['piatto bilanciato', 'verdure', 'proteine', 'carboidrati'],
},
  {
    id: 'condiments',
    title: 'Condimenti: i grassi non si eliminano, si dosano',
    subtitle: 'Risultati costanti senza “tagli drastici”',
    icon: <Heart className="w-5 h-5 text-amber-700" />,
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    bullets: [
      'Olio: 1 cucchiaio a pasto se non ci sono altri grassi',
      'Se aggiungi frutta secca/avocado/formaggi/salse: riduci l’olio',
      'Occhio ai grassi “invisibili”: condimenti pronti, snack, formaggi extra',
    ],
    takeaway: 'Il problema non è il grasso: è la somma che non vedi.',
    imageUrl: '',
    imageAlt: 'Schema condimenti e grassi invisibili',
    keywords: ['condimenti', 'olio', 'grassi', 'frutta secca', 'salse'],
  },
  {
    id: 'glycemic',
    title: 'Picchi glicemici: se controlli il picco, controlli la fame',
    subtitle: 'La fame “di ritorno” spesso nasce qui',
    icon: <TrendingUp className="w-5 h-5 text-blue-700" />,
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    bullets: [
      'Mai carboidrati da soli',
      'Abbina proteine e/o grassi',
      'Aggiungi fibre: verdure, legumi, semi',
    ],
    examples: [
      { bad: 'Pane + marmellata', good: 'Pane + ricotta/yogurt greco + frutta' },
      { bad: 'Frutta da sola', good: 'Frutta + yogurt / frutta + mandorle' },
    ],
    takeaway: 'Meno picchi = più energia e meno “attacchi di fame”.',
    imageUrl: '',
    imageAlt: 'Schema picchi glicemici e stabilità',
    keywords: ['picchi glicemici', 'carboidrati da soli', 'fibre', 'abbina'],
  },
  {
    id: 'hunger',
    title: 'Se hai fame dopo il pasto: cosa fare',
    subtitle: 'Regole pratiche, niente panico',
    icon: <MessageSquare className="w-5 h-5 text-emerald-700" />,
    gradient: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    bullets: [
      'Ho messo proteine vere nel piatto?',
      'Ho messo verdure a volume?',
      'Ho bevuto acqua?',
      'Sono passate almeno 2 ore?',
    ],
    takeaway:
      'Se è fame vera: aggiungi proteine (o proteine + grassi). Se è fame nervosa: pausa 10 minuti prima di decidere.',
    imageUrl: '',
    imageAlt: 'Schema fame vera vs fame nervosa',
    keywords: ['fame dopo', 'fame vera', 'fame nervosa', 'pausa'],
  },
  {
    id: 'snacks',
    title: 'Merende bilanciate (e sfizi gestiti bene)',
    subtitle: 'La merenda è un mini-pasto: non un premio',
    icon: <Apple className="w-5 h-5 text-rose-700" />,
    gradient: 'from-rose-50 to-pink-50',
    border: 'border-rose-200',
    bullets: [
      'Formula: Carboidrato + Proteina oppure Proteina + Grassi',
      'Se vuoi uno sfizio (es. Kinder Bueno): va bene, ma abbinalo a qualcosa che nutre',
      'È il bilancio settimanale che parla: una scelta gestita non rovina il percorso',
    ],
    examples: [
      { bad: 'Sfizio da solo + poi “fame”', good: 'Sfizio + yogurt/proteine + frutta (o fibra)' },
      { bad: 'Solo frutta e basta', good: 'Frutta + yogurt / frutta + mandorle' },
    ],
    takeaway: 'Non togliere: bilancia.',
    imageUrl: '',
    imageAlt: 'Schema merenda bilanciata',
    keywords: ['merenda', 'spuntino', 'sfizio', 'kinder bueno', 'bilancia'],
  },
  {
    id: 'preworkout',
    title: 'Pre-allenamento: energia utile',
    subtitle: 'Se ti alleni entro 1–2 ore',
    icon: <Dumbbell className="w-5 h-5 text-orange-700" />,
    gradient: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    bullets: [
      'Carboidrato + proteina leggera',
      'Grassi bassi (digestione più rapida)',
      'Se hai poco tempo: scegli qualcosa di semplice',
    ],
    examples: [{ bad: 'Solo zuccheri', good: 'Yogurt + banana / pane + ricotta' }],
    takeaway: 'Serve energia disponibile, non digestione lenta.',
    imageUrl: '',
    imageAlt: 'Schema pre-allenamento',
    keywords: ['pre allenamento', 'prima allenamento', 'energia'],
  },
  {
    id: 'postworkout',
    title: 'Post-allenamento: costruisci il risultato',
    subtitle: 'Qui consolidiamo il lavoro fatto',
    icon: <Dumbbell className="w-5 h-5 text-purple-700" />,
    gradient: 'from-purple-50 to-indigo-50',
    border: 'border-purple-200',
    bullets: [
      'Proteine sempre',
      'Carboidrati se allenamento intenso/lungo',
      'Grassi moderati',
    ],
    examples: [{ bad: 'Solo carboidrati', good: 'Uova + pane / riso + pollo / yogurt greco + frutta' }],
    takeaway: 'Dopo l’allenamento si costruisce il risultato.',
    imageUrl: '',
    imageAlt: 'Schema post-allenamento',
    keywords: ['post allenamento', 'dopo allenamento', 'recupero'],
  },
  {
    id: '8020',
    title: 'Regola 80/20: come funziona davvero (pasti + spesa)',
    subtitle: 'Il metodo che ti fa dimagrire senza mollare',
    icon: <Heart className="w-5 h-5 text-gray-700" />,
    gradient: 'from-gray-50 to-slate-50',
    border: 'border-gray-200',
    bullets: [
      '80%: scelte “Metodo” (pasti bilanciati + spesa base utile)',
      '20%: flessibilità pianificata (sfizi/uscite/extra)',
      'Regola pratica: scegli, goditela, e rientra nel metodo al pasto dopo',
    ],
    examples: [
      { bad: '“Ho sgarrrato → ormai è finita”', good: '“Scelgo 1 cosa e torno al metodo subito”' },
      { bad: 'Spesa piena di “extra” e niente base', good: 'Spesa: 80% base + 20% sfizi scelti' },
    ],
    takeaway: '80/20 non è libertà totale: è flessibilità programmata. Il bilancio settimanale decide.',
    imageUrl: '',
    imageAlt: 'Schema regola 80/20',
    keywords: ['80/20', 'bilancio settimanale', 'flessibilità', 'spesa'],
  },
  {
    id: 'shopping',
    title: 'Segui menù + lista spesa: organizzazione = risultati',
    subtitle: 'Se in casa c’è equilibrio, mangi equilibrio',
    icon: <Calendar className="w-5 h-5 text-sky-700" />,
    gradient: 'from-sky-50 to-blue-50',
    border: 'border-sky-200',
    bullets: [
      'Meno improvvisazione: più coerenza',
      'Lista spesa = meno scelte impulsive',
      'Se sostituisci: usa le regole (piatto bilanciato + abbinamenti)',
    ],
    takeaway: 'Il metodo funziona se lo segui con coerenza.',
    imageUrl: '',
    imageAlt: 'Schema lista spesa e pianificazione',
    keywords: ['lista della spesa', 'spesa', 'menù', 'pianificazione'],
  },
];

const CoachingJourneyView: React.FC<CoachingJourneyViewProps> = ({ userId }) => {
  const [plan, setPlan] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [daysRemaining, setDaysRemaining] = useState(0);
  const [preConsultationState, setPreConsultationState] = useState<PreConsultationState>('NONE');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // toggle per mostrare più/meno card dentro "Principi guida"
  const [showAllPrinciples, setShowAllPrinciples] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // 1) Profilo
      const { data: profileData, error: profileErr } = await supabase
        .from('user_profiles')
        .select(
          'id, subscription_type, subscription_status, subscription_start_date, subscription_end_date, subscription_expires_at, consultation_completed, consultation_completed_at, follow_ups_remaining'
        )
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      setProfile(profileData);

      const isComplete = (profileData?.subscription_type || '').toLowerCase() === 'complete';
      const consultationCompleted = profileData?.consultation_completed === true;

      // 2) Se Complete ma consulenza NON completata → distinguo usando appointments
      if (isComplete && !consultationCompleted) {
        const { data: appts, error: apptErr } = await supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, service_type, appointment_type')
          .eq('user_id', userId)
          .eq('service_type', 'metodo_restart')
          .eq('appointment_type', 'initial')
          .in('status', ['pending', 'confirmed'])
          .order('appointment_date', { ascending: true })
          .limit(10);

        if (apptErr) {
          console.warn('Appointments lookup failed:', apptErr.message);
          setPreConsultationState('NEEDS_BOOKING');
          setPlan(null);
          setDaysRemaining(0);
          setStartDate(null);
          setEndDate(null);
          return;
        }

        const now = new Date();
        const hasFutureInitial = (appts || []).some((a: any) => {
          if (!a?.appointment_date) return false;
          const dt = combineDateTimeLocal(a.appointment_date, a.appointment_time);
          return dt.getTime() > now.getTime();
        });

        setPreConsultationState(hasFutureInitial ? 'BOOKED_WAITING' : 'NEEDS_BOOKING');

        // Prima della consulenza: niente piano e niente countdown
        setPlan(null);
        setDaysRemaining(0);
        setStartDate(null);
        setEndDate(null);
        return;
      }

      setPreConsultationState('NONE');

      // 3) Carica piano coaching (consulenza completata → deve esserci)
      const { data: planData, error: planErr } = await supabase
        .from('nutritional_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_coaching_based', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planErr) throw planErr;
      setPlan(planData || null);

      // 4) Countdown: 90 giorni dalla consulenza completata
      const now = new Date();

      let start: Date | null = null;
      if (profileData?.consultation_completed_at) {
        start = parseTimestamptzToDate(profileData.consultation_completed_at);
      } else if (planData?.created_at) {
        start = parseTimestamptzToDate(planData.created_at);
      }

      if (!start) {
        setStartDate(null);
        setEndDate(null);
        setDaysRemaining(0);
        return;
      }

      const end = addDays(start, 90);

      setStartDate(start);
      setEndDate(end);
      setDaysRemaining(diffDaysInclusive(end, now));
    } catch (e) {
      console.error('Error loading coaching journey:', e);
      setPlan(null);
      setDaysRemaining(0);
      setStartDate(null);
      setEndDate(null);
      setPreConsultationState('NEEDS_BOOKING');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const total = toDateOnlyLocal(endDate).getTime() - toDateOnlyLocal(startDate).getTime();
    if (total <= 0) return 0;

    const now = new Date();
    const elapsed = toDateOnlyLocal(now).getTime() - toDateOnlyLocal(startDate).getTime();
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return Math.round(pct);
  }, [startDate, endDate]);

  // ==========================
  // BUILD PRINCIPLES (dedupe)
  // ==========================
  const dbPrinciples: string[] = Array.isArray(plan?.coaching_principles) ? plan.coaching_principles : [];

  // Filtra principi DB che duplicano le card standard (heuristica keyword)
  const filteredDbPrinciples = useMemo(() => {
    if (!dbPrinciples.length) return [];
    return dbPrinciples.filter((p) => {
      const cardKeywords = defaultRestartPrinciplesCards
        .flatMap((c) => c.keywords || [])
        .filter(Boolean);
      // se il principio DB contiene keyword forti, lo consideriamo già coperto dalle card
      return !includesAnyKeyword(p, cardKeywords);
    });
  }, [dbPrinciples]);

  const visiblePrincipleCards = useMemo(() => {
    const base = defaultRestartPrinciplesCards;
    return showAllPrinciples ? base : base.slice(0, 6);
  }, [showAllPrinciples]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // ==========================
  // PRE-CONSULTATION STATES
  // ==========================
  if (preConsultationState === 'NEEDS_BOOKING') {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-8 text-center">
        <Target className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Prenota la tua Consulenza Iniziale
        </h3>
        <p className="text-gray-600 mb-6">
          Il tuo piano Metodo Restart sarà disponibile subito dopo la consulenza.
          Prenota l’appuntamento per iniziare.
        </p>
        <a
          href="/dashboard#appointments"
          className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          Prenota Consulenza
        </a>
      </div>
    );
  }

  if (preConsultationState === 'BOOKED_WAITING') {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-8 text-center">
        <Calendar className="w-16 h-16 text-rose-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Consulenza prenotata
        </h3>
        <p className="text-gray-600 mb-6">
          Perfetto! Il tuo piano sarà visibile subito dopo la consulenza.
          Se vuoi, puoi controllare data e orario nella sezione Appuntamenti.
        </p>
        <a
          href="/dashboard#appointments"
          className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          Vai agli Appuntamenti
        </a>
      </div>
    );
  }

  // ==========================
  // CONSULTATION COMPLETED
  // ==========================
  if (!plan) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Piano non disponibile
        </h3>
        <p className="text-gray-600 mb-6">
          Aggiorna la pagina. Se il problema persiste, contatta l’assistenza.
        </p>
        <button
          onClick={fetchAll}
          className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          Ricarica
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con giorni rimanenti + progress */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Metodo Restart - Il Tuo Percorso</h2>
            <p className="text-rose-100">
              3 mesi di trasformazione: nutrizione, allenamento e integrazione
            </p>

            {startDate && endDate && (
              <div className="mt-4 text-sm text-rose-100">
                <div>
                  <strong>Inizio:</strong> {formatDateIT(startDate)} • <strong>Fine:</strong> {formatDateIT(endDate)}
                </div>
                <div className="mt-2 w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-1">{progressPercent}% completato</div>
              </div>
            )}
          </div>

          <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 flex-shrink-0">
            <div className="text-3xl font-bold">{daysRemaining}</div>
            <div className="text-sm text-rose-100">giorni rimanenti</div>
          </div>
        </div>
      </div>

      {/* I Tuoi Principi Guida (card visive + eventuali principi custom) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">I Tuoi Principi Guida</h3>
              <p className="text-sm text-gray-600 mt-1">
                Qui trovi le regole pratiche del Metodo. Niente grammature: applichi queste e sei nel metodo.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAllPrinciples((v) => !v)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {showAllPrinciples ? 'Mostra meno' : 'Mostra tutto'}
          </button>
        </div>

        {/* Card visuali standard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visiblePrincipleCards.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border ${c.border} bg-gradient-to-br ${c.gradient} p-5`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* testo */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-lg p-2">
                      {c.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{c.title}</div>
                      {c.subtitle && <div className="text-sm text-gray-600 mt-0.5">{c.subtitle}</div>}
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-800">
                    {c.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {c.examples?.length ? (
                    <div className="mt-3 space-y-2">
                      {c.examples.map((ex, i) => (
                        <div key={i} className="text-sm">
                          <div className="text-gray-700">
                            <span className="font-semibold">Evita:</span> {ex.bad}
                          </div>
                          <div className="text-gray-900">
                            <span className="font-semibold">Meglio:</span> {ex.good}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {c.takeaway && (
                    <div className="mt-3 text-sm font-semibold text-gray-900">
                      {c.takeaway}
                    </div>
                  )}
                </div>

                {/* immagine */}
                <div className="md:w-44 lg:w-52 flex-shrink-0">
                  <div className="w-full aspect-[4/3] rounded-lg border border-white/60 bg-white/50 overflow-hidden flex items-center justify-center">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.imageAlt || c.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-xs text-gray-500 px-3 text-center">
                        Inserisci qui lo schema visivo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Principi custom dal DB (non duplicati) */}
        {filteredDbPrinciples.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-900 mb-3">
              Indicazioni personalizzate della nutrizionista
            </div>
            <div className="space-y-3">
              {filteredDbPrinciples.map((principle: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100"
                >
                  <span className="text-2xl flex-shrink-0">✓</span>
                  <p className="text-gray-800 font-medium">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note di questa settimana */}
      {plan.weekly_coaching_notes && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Messaggio della Nutrizionista</h3>
          </div>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">
            {plan.weekly_coaching_notes}
          </p>
        </div>
      )}

      {/* Frequenza Allenamenti */}
      {plan.training_frequency && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-gray-900">Il Tuo Piano Allenamento</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-rose-50 rounded-lg px-6 py-3 text-center">
              <div className="text-3xl font-bold text-rose-600">{plan.training_frequency}</div>
              <div className="text-sm text-gray-600">volte/settimana</div>
            </div>
            {plan.training_notes && (
              <p className="flex-1 text-gray-700">{plan.training_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/monthly-menu"
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200 hover:shadow-lg transition-all group"
        >
          <Apple className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">Menu Settimanali</h4>
          <p className="text-sm text-gray-600">Genera i tuoi menu personalizzati</p>
        </a>

        <a
          href="/food-diary"
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 hover:shadow-lg transition-all group"
        >
          <TrendingUp className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">Diario Alimentare</h4>
          <p className="text-sm text-gray-600">Traccia i tuoi pasti e progressi</p>
        </a>

        <a
          href="/dashboard#workouts"
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-all group"
        >
          <Dumbbell className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">Allenamenti</h4>
          <p className="text-sm text-gray-600">Accedi ai tuoi workout</p>
        </a>
      </div>

      {/* Info sul percorso */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Questo non è un piano rigido con grammature da seguire alla lettera.
          È un percorso di rieducazione alimentare: impari a bilanciare, gestire gli sfizi e costruire abitudini sostenibili.
        </p>
      </div>

      {/* Follow-up reminder (dinamico) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-bold text-gray-900">Prossimi Passi</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Follow-up rimanenti: <strong>{profile?.follow_ups_remaining ?? 0}</strong>
        </p>

        <a
          href="/dashboard#appointments"
          className="inline-block px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          Prenota Follow-Up
        </a>
      </div>
    </div>
  );
};

export default CoachingJourneyView;