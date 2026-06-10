import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  BookOpen,
  TrendingUp,
  Calendar,
  Lightbulb,
  Clock,
  Utensils,
  Apple,
  Heart,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DynamicTipsProps {
  userId: string;
  subscriptionType: string | null;
  hasActiveMenu: boolean;
  onNavigate: (tab: string) => void;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: number;
}

const DynamicTips: React.FC<DynamicTipsProps> = ({
  userId,
  subscriptionType,
  hasActiveMenu,
  onNavigate
}) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [lastDiaryEntry, setLastDiaryEntry] = useState<Date | null>(null);
  const [lastMeasurement, setLastMeasurement] = useState<Date | null>(null);

  useEffect(() => {
    loadUserActivity();
  }, [userId]);

  useEffect(() => {
    generateTips();
  }, [subscriptionType, hasActiveMenu, lastDiaryEntry, lastMeasurement]);

  const loadUserActivity = async () => {
    const { data: diaryEntries } = await supabase
      .from('food_diary_entries')
      .select('entry_date')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (diaryEntries) {
      setLastDiaryEntry(new Date(diaryEntries.entry_date));
    }

    const { data: measurements } = await supabase
      .from('measurements')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (measurements) {
      setLastMeasurement(new Date(measurements.created_at));
    }
  };

  const generateTips = () => {
    const allTips: Tip[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceLastDiary = lastDiaryEntry
      ? Math.floor((today.getTime() - lastDiaryEntry.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const daysSinceLastMeasurement = lastMeasurement
      ? Math.floor((today.getTime() - lastMeasurement.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (!subscriptionType || subscriptionType === 'none' || subscriptionType === 'free') {
      allTips.push({
        id: 'upgrade',
        title: 'Sblocca Funzionalita Avanzate',
        description: 'Passa a un abbonamento premium per accedere a menu personalizzati, piani nutrizionali dettagliati e molto altro.',
        icon: <Lightbulb className="w-6 h-6" />,
        color: 'text-orange-600',
        bgColor: 'from-orange-50 to-orange-100 border-orange-200',
        priority: 10
      });
    }

    if (hasActiveMenu && (subscriptionType === 'monthly_subscription' || subscriptionType === 'premium')) {
      if (dayOfWeek === 0) {
        allTips.push({
          id: 'meal-prep-sunday',
          title: 'Domenica: Giornata Ideale per il Meal Prep',
          description: 'Dedica qualche ora oggi alla preparazione dei pasti della settimana. Cucina le proteine, taglia le verdure e prepara i contenitori. Risparmierai tempo durante la settimana!',
          icon: <ChefHat className="w-6 h-6" />,
          color: 'text-purple-600',
          bgColor: 'from-purple-50 to-purple-100 border-purple-200',
          action: {
            label: 'Vedi Menu Settimanale',
            onClick: () => onNavigate('menus')
          },
          priority: 9
        });
      }

      allTips.push({
        id: 'menu-prep',
        title: 'Prepara i Pasti con Anticipo',
        description: 'Consulta il tuo menu settimanale e prepara alcuni pasti in anticipo. La preparazione ti aiutera a seguire meglio il piano e risparmiare tempo.',
        icon: <Utensils className="w-6 h-6" />,
        color: 'text-green-600',
        bgColor: 'from-green-50 to-green-100 border-green-200',
        action: {
          label: 'Vedi Menu',
          onClick: () => onNavigate('menus')
        },
        priority: 7
      });

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        allTips.push({
          id: 'stay-on-track',
          title: 'Resta in Carreggiata',
          description: 'Segui il menu giornaliero per raggiungere i tuoi obiettivi. Ogni pasto e studiato per fornirti i nutrienti giusti al momento giusto.',
          icon: <Apple className="w-6 h-6" />,
          color: 'text-red-600',
          bgColor: 'from-red-50 to-red-100 border-red-200',
          action: {
            label: 'Vedi Menu Oggi',
            onClick: () => onNavigate('menus')
          },
          priority: 6
        });
      }
    }

    if (subscriptionType && subscriptionType !== 'none' && subscriptionType !== 'free') {
      if (daysSinceLastDiary > 1) {
        allTips.push({
          id: 'diary-reminder',
          title: 'Compila il Diario Alimentare',
          description: `Non registri i tuoi pasti da ${daysSinceLastDiary} giorni. Tenere traccia di cio che mangi ti aiuta a rimanere consapevole e motivato.`,
          icon: <BookOpen className="w-6 h-6" />,
          color: 'text-blue-600',
          bgColor: 'from-blue-50 to-blue-100 border-blue-200',
          action: {
            label: 'Apri Diario',
            onClick: () => onNavigate('diary')
          },
          priority: 8
        });
      }

      if (daysSinceLastMeasurement > 7) {
        const weeksSince = Math.floor(daysSinceLastMeasurement / 7);
        allTips.push({
          id: 'progress-check',
          title: 'Controlla i Tuoi Progressi',
          description: `E passata ${weeksSince > 1 ? weeksSince + ' settimane' : 'una settimana'} dall'ultimo controllo. Misura peso e circonferenze per monitorare i tuoi progressi.`,
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-teal-600',
          bgColor: 'from-teal-50 to-teal-100 border-teal-200',
          action: {
            label: 'Aggiungi Misurazione',
            onClick: () => onNavigate('progress')
          },
          priority: 7
        });
      }

      if (dayOfWeek === 1) {
        allTips.push({
          id: 'weekly-review',
          title: 'Inizio Settimana: Rivedi i Tuoi Obiettivi',
          description: 'Inizia la settimana con il piede giusto! Rivedi i tuoi obiettivi, pianifica i pasti e preparati mentalmente per una settimana di successo.',
          icon: <Calendar className="w-6 h-6" />,
          color: 'text-indigo-600',
          bgColor: 'from-indigo-50 to-indigo-100 border-indigo-200',
          priority: 6
        });
      }

      allTips.push({
        id: 'hydration',
        title: 'Mantieniti Idratato',
        description: 'Ricorda di bere almeno 2 litri d\'acqua al giorno. L\'idratazione e fondamentale per il metabolismo e il benessere generale.',
        icon: <Heart className="w-6 h-6" />,
        color: 'text-cyan-600',
        bgColor: 'from-cyan-50 to-cyan-100 border-cyan-200',
        priority: 5
      });

      if (dayOfWeek === 6 || dayOfWeek === 0) {
        allTips.push({
          id: 'weekend-planning',
          title: 'Pianifica il Weekend',
          description: 'Nel weekend e facile uscire dalla routine. Pianifica in anticipo i pasti fuori casa e mantieni un equilibrio tra divertimento e salute.',
          icon: <Clock className="w-6 h-6" />,
          color: 'text-orange-600',
          bgColor: 'from-orange-50 to-orange-100 border-orange-200',
          priority: 6
        });
      }

      allTips.push({
        id: 'consistency',
        title: 'La Costanza e la Chiave',
        description: 'I risultati arrivano con la costanza. Anche nei giorni difficili, piccoli passi avanti fanno la differenza nel lungo termine.',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-green-600',
        bgColor: 'from-green-50 to-green-100 border-green-200',
        priority: 4
      });
    }

    allTips.sort((a, b) => b.priority - a.priority);
    setTips(allTips);
  };

  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [tips.length]);

  if (tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];

  return (
    <div className="relative overflow-hidden">
      <div className={`bg-gradient-to-r ${currentTip.bgColor} border rounded-2xl p-6 transition-all duration-500`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${currentTip.color.replace('text-', 'bg-')} bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
            <div className={currentTip.color}>
              {currentTip.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{currentTip.title}</h3>
              {tips.length > 1 && (
                <div className="flex gap-1">
                  {tips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTipIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentTipIndex
                          ? 'bg-gray-900 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Vai al suggerimento ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-700 mb-4">{currentTip.description}</p>
            {currentTip.action && (
              <button
                onClick={currentTip.action.onClick}
                className={`${currentTip.color.replace('text-', 'bg-')} text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2`}
              >
                {currentTip.action.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicTips;
