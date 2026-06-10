import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Loader, AlertCircle } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { supabase } from '../lib/supabase';
import WeeklyMenuViewer from './WeeklyMenuViewer';
import { canGenerateMenus } from '../utils/subscriptionFeatures';

interface WeeklyMenuSectionProps {
  userId: string;
  userProfile: any;
}

interface WeeklyMenu {
  id: string;
  title: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  avg_daily_calories?: number;
  avg_daily_protein?: number;
  avg_daily_carbs?: number;
  avg_daily_fats?: number;
  menu_content?: string | null;
  shopping_list?: string | null;
  plan_id?: string | null;
  user_id?: string | null;
  ai_response?: any;
}

const WeeklyMenuSection: React.FC<WeeklyMenuSectionProps> = ({ userId, userProfile }) => {
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [canGenerate, setCanGenerate] = useState(true);
  const [nextGenerationDate, setNextGenerationDate] = useState<Date | null>(null);
  const [needsAssessment, setNeedsAssessment] = useState(false);

  const subType = String(userProfile?.subscription_type ?? '').toLowerCase();
  const isMonthly = subType === 'monthly_subscription';
  const isComplete = subType === 'complete';
  const isPremiumOrAdmin = subType === 'premium' || subType === 'admin';

  const planBadgeLabel =
    isComplete ? 'Complete' : isMonthly ? 'Monthly' : isPremiumOrAdmin ? 'Premium' : 'Piano';

  useEffect(() => {
    if (!userId) return;
    loadMenus();
    checkGenerationLimit();
  }, [userId, userProfile?.subscription_type, userProfile?.subscription_status, userProfile?.subscription_end_date, userProfile?.trial_end_date]);

  useRefreshOnFocus(() => {
    if (userId) {
      loadMenus(true);
      checkGenerationLimit();
    }
  });

  const getAuthToken = async (): Promise<string> => {
    const { data, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw new Error(sessErr.message);

    const token = data?.session?.access_token;
    if (!token) {
      throw new Error('Sessione non valida. Effettua di nuovo il login.');
    }

    return token;
  };

  const getLatestPlanIdForUser = async (): Promise<string | null> => {
    let query = supabase
      .from('nutritional_plans')
      .select('id, is_coaching_based, created_at')
      .eq('user_id', userId);

    if (isComplete) {
      query = query.eq('is_coaching_based', true);
    }

    if (isPremiumOrAdmin) {
      query = query.eq('is_coaching_based', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) return null;

    return data[0].id;
  };

  const getLatestAssessment = async () => {
    const { data, error } = await supabase
      .from('user_assessments')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  };

  const loadMenus = async (silent = false) => {
    try {
      if (!silent) { setLoading(true); setError(''); }

      const selectFields =
  'id,title,week_start_date,week_end_date,status,avg_daily_calories,avg_daily_protein,avg_daily_carbs,avg_daily_fats,menu_content,shopping_list,plan_id,user_id,ai_response';

      if (isMonthly) {
        const { data, error: menuError } = await supabase
          .from('weekly_menus')
          .select(selectFields)
          .eq('user_id', userId)
          .eq('status', 'published')
          .order('week_start_date', { ascending: false });

        if (menuError) throw menuError;

        setMenus((data as WeeklyMenu[]) || []);
        return;
      }

      const planId = await getLatestPlanIdForUser();

      if (!planId) {
        setMenus([]);
        return;
      }

      const { data, error: menuError } = await supabase
        .from('weekly_menus')
        .select(selectFields)
        .eq('plan_id', planId)
        .eq('status', 'published')
        .order('week_start_date', { ascending: false });

      if (menuError) throw menuError;

      setMenus((data as WeeklyMenu[]) || []);
    } catch (err) {
      console.error('Error loading menus:', err);
      if (!silent) setError('Errore nel caricamento dei menù');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkGenerationLimit = async () => {
    try {
      setNeedsAssessment(false);

      const subscriptionEndDate =
        userProfile?.subscription_end_date || userProfile?.trial_end_date;

      const hasMenuAccess = canGenerateMenus(
        userProfile?.subscription_type,
        subscriptionEndDate,
        userProfile?.subscription_status,
        userProfile?.trial_end_date
      );

      if (!hasMenuAccess) {
        setCanGenerate(false);
        setNextGenerationDate(null);
        return;
      }

      if (isMonthly) {
        const latestAssessment = await getLatestAssessment();

        if (!latestAssessment) {
          setCanGenerate(false);
          setNeedsAssessment(true);
          setNextGenerationDate(null);
          return;
        }

        const { data: recentMenus, error: recentMenusError } = await supabase
          .from('weekly_menus')
          .select('week_start_date')
          .eq('user_id', userId)
          .order('week_start_date', { ascending: false })
          .limit(1);

        if (recentMenusError) throw recentMenusError;

        if (recentMenus && recentMenus.length > 0) {
          const menuStartDate = new Date(recentMenus[0].week_start_date);
          const menuEndDate = new Date(menuStartDate);
          menuEndDate.setDate(menuEndDate.getDate() + 6);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          menuEndDate.setHours(0, 0, 0, 0);

          if (today >= menuEndDate) {
            setCanGenerate(true);
            setNextGenerationDate(null);
          } else {
            setCanGenerate(false);
            setNextGenerationDate(menuEndDate);
          }
        } else {
          setCanGenerate(true);
          setNextGenerationDate(null);
        }

        return;
      }

      const planId = await getLatestPlanIdForUser();

      if (!planId) {
        setCanGenerate(false);
        setNextGenerationDate(null);
        return;
      }

      const { data: recentMenus, error: recentMenusError } = await supabase
        .from('weekly_menus')
        .select('week_start_date')
        .eq('plan_id', planId)
        .order('week_start_date', { ascending: false })
        .limit(1);

      if (recentMenusError) throw recentMenusError;

      if (recentMenus && recentMenus.length > 0) {
        const menuStartDate = new Date(recentMenus[0].week_start_date);
        const menuEndDate = new Date(menuStartDate);
        menuEndDate.setDate(menuEndDate.getDate() + 6);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        menuEndDate.setHours(0, 0, 0, 0);

        if (today >= menuEndDate) {
          setCanGenerate(true);
          setNextGenerationDate(null);
        } else {
          setCanGenerate(false);
          setNextGenerationDate(menuEndDate);
        }
      } else {
        setCanGenerate(true);
        setNextGenerationDate(null);
      }
    } catch (err) {
      console.error('Error checking generation limit:', err);
      setCanGenerate(false);
    }
  };

  const handleGenerateMenu = async () => {
    if (!canGenerate || generating) return;

    try {
      setGenerating(true);
      setError('');

      const token = await getAuthToken();

      if (isMonthly) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-menu-v3`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Errore nella generazione del menù');
  }

  await loadMenus();
  await checkGenerationLimit();
  return;
}

      const planId = await getLatestPlanIdForUser();

      if (!planId) {
        throw new Error('Nessun piano nutrizionale trovato');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu-from-recipes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nella generazione del menù');
      }

      await loadMenus();
      await checkGenerationLimit();
    } catch (err: any) {
      console.error('Error generating menu:', err);
      setError(err.message || 'Errore nella generazione del menù');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-brand-burgundy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Menù Settimanali</h2>
          <p className="text-gray-600 mt-1">
            Genera menù personalizzati basati sul tuo piano nutrizionale
          </p>
        </div>
        <span className="bg-brand-burgundy/10 text-brand-burgundy px-4 py-2 rounded-full font-medium">
          Piano {planBadgeLabel}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-brand-burgundy to-brand-burgundy-dark rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Genera il tuo Menù Settimanale</h3>
            <p className="text-white/90 mb-4">
              Crea un menù personalizzato che rispetta il tuo piano nutrizionale, allergie e preferenze.
              {!canGenerate && nextGenerationDate && (
                <span className="block mt-2 text-sm">
                  Prossima generazione disponibile: {nextGenerationDate.toLocaleDateString('it-IT')}
                </span>
              )}
              {!canGenerate && needsAssessment && (
                <span className="block mt-2 text-sm bg-white/20 rounded-lg p-3">
                  ⚠️ Per generare menù personalizzati, completa prima il questionario con le tue preferenze alimentari
                  nella sezione Panoramica.
                </span>
              )}
            </p>

            <ul className="space-y-2 text-sm text-white/90 mb-4">
              <li className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Nuovo menù disponibile l&apos;ultimo giorno del menù corrente</span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Rispetta target calorici e macro</span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Include ricette e lista spesa automatica</span>
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleGenerateMenu}
          disabled={!canGenerate || generating}
          className="bg-white text-brand-burgundy px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Generazione in corso...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>{canGenerate ? 'Genera Menù Settimanale' : 'Generazione non disponibile'}</span>
            </>
          )}
        </button>
      </div>

      {menus.length > 0 ? (
        <WeeklyMenuViewer menus={menus} />
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nessun Menù Disponibile</h3>
          <p className="text-gray-600 mb-6">
            Genera il tuo primo menù settimanale personalizzato cliccando sul bottone qui sopra.
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklyMenuSection;