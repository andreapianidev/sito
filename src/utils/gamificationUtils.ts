import { supabase } from '../lib/supabase';

export const awardPoints = async (
  userId: string,
  points: number,
  actionType: string,
  description: string,
  metadata: any = {}
) => {
  try {
    const { error: functionError } = await supabase.rpc('add_points_to_user', {
      p_user_id: userId,
      p_points: points,
      p_action_type: actionType,
      p_description: description,
      p_metadata: metadata
    });

    if (functionError) {
      console.error('Error awarding points:', functionError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in awardPoints:', error);
    return false;
  }
};

export const handleDailyLogin = async (userId: string) => {
  try {
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('last_login_date')
      .eq('user_id', userId)
      .maybeSingle();

    const today = new Date().toISOString().split('T')[0];

    if (!userPoints || userPoints.last_login_date !== today) {
      await awardPoints(userId, 5, 'daily_login', 'Login giornaliero', { date: today });

      const { error: streakError } = await supabase.rpc('update_user_streak', {
        p_user_id: userId
      });

      if (streakError) {
        console.error('Error updating streak:', streakError);
      }
    }
  } catch (error) {
    console.error('Error in handleDailyLogin:', error);
  }
};

export const handleDiaryCompletion = async (userId: string, date: string) => {
  try {
    const { data: entries } = await supabase
      .from('food_diary_entries')
      .select('meal_type')
      .eq('user_id', userId)
      .eq('entry_date', date);

    if (entries && entries.length >= 3) {
      const { data: existingTransaction } = await supabase
        .from('points_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', 'diary_completion')
        .eq('metadata->>date', date)
        .maybeSingle();

      if (!existingTransaction) {
        await awardPoints(userId, 10, 'diary_completion', 'Diario alimentare completato', { date });

        const consecutiveDays = await checkConsecutiveDiaryDays(userId);
        if (consecutiveDays >= 7) {
          const { data: badgeExists } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_type', 'diary_perfect')
            .maybeSingle();

          if (!badgeExists) {
            await supabase.from('user_badges').insert({
              user_id: userId,
              badge_type: 'diary_perfect',
              metadata: { days: consecutiveDays }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in handleDiaryCompletion:', error);
  }
};

const checkConsecutiveDiaryDays = async (userId: string): Promise<number> => {
  try {
    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action_type', 'diary_completion')
      .order('created_at', { ascending: false })
      .limit(7);

    if (!transactions || transactions.length < 7) return 0;

    let consecutiveDays = 1;
    for (let i = 0; i < transactions.length - 1; i++) {
      const currentDate = new Date(transactions[i].created_at);
      const nextDate = new Date(transactions[i + 1].created_at);
      const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  } catch (error) {
    console.error('Error checking consecutive diary days:', error);
    return 0;
  }
};

export const handleMeasurementUpdate = async (userId: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('action_type', 'measurement_update')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    if (!existingTransaction ||
        (new Date(existingTransaction.created_at).getTime() + 24 * 60 * 60 * 1000) < now.getTime()) {
      await awardPoints(userId, 15, 'measurement_update', 'Aggiornamento misurazioni', {
        date: now.toISOString().split('T')[0]
      });
    }
  } catch (error) {
    console.error('Error in handleMeasurementUpdate:', error);
  }
};

export const handleContentView = async (userId: string, contentId: string, contentType: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', 'content_view')
      .eq('metadata->>content_id', contentId)
      .maybeSingle();

    if (!existingTransaction) {
      await awardPoints(userId, 5, 'content_view', `Visualizzazione contenuto ${contentType}`, {
        content_id: contentId,
        content_type: contentType
      });
    }
  } catch (error) {
    console.error('Error in handleContentView:', error);
  }
};

export const handleMenuFeedback = async (userId: string, menuId: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', 'menu_feedback')
      .eq('metadata->>menu_id', menuId)
      .maybeSingle();

    if (!existingTransaction) {
      await awardPoints(userId, 10, 'menu_feedback', 'Feedback su menu settimanale', {
        menu_id: menuId
      });
    }
  } catch (error) {
    console.error('Error in handleMenuFeedback:', error);
  }
};

export const handleFirstAppointment = async (userId: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', 'first_appointment')
      .maybeSingle();

    if (!existingTransaction) {
      await awardPoints(userId, 30, 'first_appointment', 'Prima consulenza completata');
    }
  } catch (error) {
    console.error('Error in handleFirstAppointment:', error);
  }
};

export const handleFollowUpBooked = async (userId: string) => {
  try {
    await awardPoints(userId, 20, 'followup_booked', 'Follow-up prenotato');
  } catch (error) {
    console.error('Error in handleFollowUpBooked:', error);
  }
};

export const handleReferralRegistration = async (referrerId: string, referralCode: string, newUserId: string) => {
  try {
    await supabase
      .from('referral_codes')
      .update({
        referred_user_id: newUserId,
        status: 'registered',
        completed_at: new Date().toISOString()
      })
      .eq('code', referralCode);

    await awardPoints(referrerId, 50, 'referral_registration', 'Amico registrato', {
      referral_code: referralCode,
      referred_user_id: newUserId
    });
  } catch (error) {
    console.error('Error in handleReferralRegistration:', error);
  }
};

export const handleReferralFirstPurchase = async (referrerId: string, newUserId: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', referrerId)
      .eq('action_type', 'referral_first_purchase')
      .eq('metadata->>referred_user_id', newUserId)
      .maybeSingle();

    if (!existingTransaction) {
      await awardPoints(referrerId, 100, 'referral_first_purchase', 'Amico ha completato primo acquisto', {
        referred_user_id: newUserId
      });
    }
  } catch (error) {
    console.error('Error in handleReferralFirstPurchase:', error);
  }
};

export const handleReferralPremium = async (referrerId: string, newUserId: string) => {
  try {
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', referrerId)
      .eq('action_type', 'referral_premium')
      .eq('metadata->>referred_user_id', newUserId)
      .maybeSingle();

    if (!existingTransaction) {
      await awardPoints(referrerId, 200, 'referral_premium', 'Amico è diventato premium', {
        referred_user_id: newUserId
      });

      const { data: referralCount } = await supabase
        .from('referral_codes')
        .select('id', { count: 'exact' })
        .eq('user_id', referrerId)
        .eq('status', 'rewarded');

      if (referralCount && referralCount.length >= 5) {
        const { data: badgeExists } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', referrerId)
          .eq('badge_type', 'ambassador')
          .maybeSingle();

        if (!badgeExists) {
          await supabase.from('user_badges').insert({
            user_id: referrerId,
            badge_type: 'ambassador',
            metadata: { referrals: referralCount.length }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in handleReferralPremium:', error);
  }
};

export const handleGoalAchieved = async (userId: string, goalType: string) => {
  try {
    const { data: badgeExists } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_type', 'goal_crusher')
      .maybeSingle();

    if (!badgeExists) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_type: 'goal_crusher',
        metadata: { goal_type: goalType }
      });

      await awardPoints(userId, 500, 'goal_achieved', 'Obiettivo raggiunto', {
        goal_type: goalType
      });
    }
  } catch (error) {
    console.error('Error in handleGoalAchieved:', error);
  }
};