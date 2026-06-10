/**
 * Utilities for managing trial subscriptions
 */

export interface SubscriptionStatus {
  canGenerateMenus: boolean;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining?: number;
  message?: string;
}

/**
 * Check if user can generate menus based on their subscription/trial status
 */
export function checkSubscriptionAccess(profile: any): SubscriptionStatus {
  const now = new Date();

  // Check trial status
  if (profile?.subscription_status === 'trial' && profile?.trial_end_date) {
    const trialEndDate = new Date(profile.trial_end_date);
    const isTrialActive = trialEndDate > now;

    if (isTrialActive) {
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        canGenerateMenus: true,
        isActive: true,
        isTrial: true,
        isExpired: false,
        daysRemaining,
        message: `Trial attivo - ${daysRemaining} giorni rimanenti`
      };
    } else {
      return {
        canGenerateMenus: false,
        isActive: false,
        isTrial: true,
        isExpired: true,
        message: 'Il tuo periodo di prova è terminato. Attiva l\'abbonamento per continuare.'
      };
    }
  }

  // Check paid subscription status (including cancelled but still in paid period)
  if (profile?.subscription_status === 'active' || profile?.subscription_status === 'cancelled') {
    // If they have a Stripe subscription ID, they're a paying customer
    if (profile?.stripe_subscription_id) {
      // Check subscription end date
      const endDate = profile?.subscription_end_date || profile?.current_period_end;

      if (endDate) {
        const subscriptionEnd = new Date(endDate);
        const isStillValid = subscriptionEnd > now;

        if (isStillValid) {
          const daysRemaining = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            canGenerateMenus: true,
            isActive: true,
            isTrial: false,
            isExpired: false,
            daysRemaining,
            message: profile?.subscription_status === 'cancelled'
              ? `Abbonamento cancellato - Resterà attivo fino al ${subscriptionEnd.toLocaleDateString('it-IT')}`
              : 'Abbonamento attivo'
          };
        }
      } else {
        // Has subscription ID but no end date - assume active only if status is 'active'
        if (profile?.subscription_status === 'active') {
          return {
            canGenerateMenus: true,
            isActive: true,
            isTrial: false,
            isExpired: false,
            message: 'Abbonamento attivo'
          };
        }
      }
    }
  }

  // Default: no active subscription
  return {
    canGenerateMenus: false,
    isActive: false,
    isTrial: false,
    isExpired: false,
    message: 'Nessun abbonamento attivo. Attiva l\'abbonamento per generare menù personalizzati.'
  };
}

/**
 * Get trial remaining days
 */
export function getTrialRemainingDays(trialEndDate: string | null): number | null {
  if (!trialEndDate) return null;

  const now = new Date();
  const endDate = new Date(trialEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if trial is active
 */
export function isTrialActive(profile: any): boolean {
  if (profile?.subscription_status !== 'trial' || !profile?.trial_end_date) {
    return false;
  }

  const now = new Date();
  const trialEndDate = new Date(profile.trial_end_date);
  return trialEndDate > now;
}

/**
 * Check if user has paid subscription (including cancelled but still in paid period)
 */
export function hasPaidSubscription(profile: any): boolean {
  if (!profile?.stripe_subscription_id) return false;

  // Active subscriptions are always considered paid
  if (profile?.subscription_status === 'active') {
    return true;
  }

  // Cancelled subscriptions are still paid if within the paid period
  if (profile?.subscription_status === 'cancelled') {
    const endDate = profile?.subscription_end_date || profile?.current_period_end;
    if (!endDate) return false;

    const now = new Date();
    const subscriptionEnd = new Date(endDate);
    return subscriptionEnd > now;
  }

  return false;
}
