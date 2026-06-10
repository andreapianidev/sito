// Feature flags per tipo di subscription

export interface SubscriptionFeatures {
  // Dashboard Tabs
  canAccessOverview: boolean;
  canAccessPlans: boolean;
  canAccessRecipes: boolean;
  canAccessWeeklyMenu: boolean;
  canAccessShoppingList: boolean;
  canAccessAppointments: boolean;
  canAccessChat: boolean;
  canAccessGuides: boolean;
  canAccessProgress: boolean;
  canAccessWorkouts: boolean;
  canAccessDiary: boolean;

  // Features Specifiche
  hasBasicPlan: boolean;
  hasWeeklyMenus: boolean;
  hasRecipes: boolean;
  hasAutomaticShoppingList: boolean;
  hasFollowUpIncluded: boolean;
  hasUnlimitedChat: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedTracking: boolean;
  hasPremiumGuides: boolean;
  hasPersonalTrainer: boolean;

  // Limiti e Durate
  validityDays: number; // Durata validità piano
  followUpsIncluded: number; // Follow-up inclusi
  ptSessionsIncluded: number; // Sessioni PT incluse
  chatMessagesPerMonth: number; // -1 = illimitati, 0 = nessuno
  weeklyMenusPerMonth: number; // -1 = illimitati
  premiumGuidesCount: number; // -1 = tutte, 0 = nessuna
}

export const getSubscriptionFeatures = (
  subscriptionType: string | undefined
): SubscriptionFeatures => {
  const type = (subscriptionType?.toLowerCase() || 'none').trim();

  switch (type) {
    case 'basic':
      return {
        // Tabs Accessibili
        canAccessOverview: true,
        canAccessPlans: true,
        canAccessRecipes: false,
        canAccessWeeklyMenu: false,
        canAccessShoppingList: false,
        canAccessAppointments: true,
        canAccessChat: true, // Limitata a 10 msg
        canAccessGuides: true, // Solo gratuite
        canAccessProgress: true,
        canAccessWorkouts: false,
        canAccessDiary: true,

        // Features
        hasBasicPlan: true,
        hasWeeklyMenus: false,
        hasRecipes: false,
        hasAutomaticShoppingList: false,
        hasFollowUpIncluded: false,
        hasUnlimitedChat: false,
        hasPrioritySupport: false,
        hasAdvancedTracking: false,
        hasPremiumGuides: false,
        hasPersonalTrainer: false,

        // Limiti
        validityDays: 30,
        followUpsIncluded: 0,
        ptSessionsIncluded: 0,
        chatMessagesPerMonth: 10, // 10 messaggi totali per 30 giorni
        weeklyMenusPerMonth: 0,
        premiumGuidesCount: 0
      };

    case 'premium':
      return {
        // Tabs Accessibili
        canAccessOverview: true,
        canAccessPlans: true,
        canAccessRecipes: true,
        canAccessWeeklyMenu: true,
        canAccessShoppingList: true,
        canAccessAppointments: true,
        canAccessChat: true,
        canAccessGuides: true,
        canAccessProgress: true,
        canAccessWorkouts: false,
        canAccessDiary: true,

        // Features
        hasBasicPlan: true,
        hasWeeklyMenus: true,
        hasRecipes: true,
        hasAutomaticShoppingList: true,
        hasFollowUpIncluded: true,
        hasUnlimitedChat: false,
        hasPrioritySupport: false,
        hasAdvancedTracking: true,
        hasPremiumGuides: true,
        hasPersonalTrainer: false,

        // Limiti
        validityDays: 60,
        followUpsIncluded: 1,
        ptSessionsIncluded: 0,
        chatMessagesPerMonth: 50, // 50 messaggi al mese per 60 giorni
        weeklyMenusPerMonth: 4, // 4 menù settimanali
        premiumGuidesCount: 2 // 2 guide a scelta
      };

    case 'complete':
      return {
        // Tabs Accessibili - TUTTO
        canAccessOverview: true,
        canAccessPlans: true,
        canAccessRecipes: true,
        canAccessWeeklyMenu: true,
        canAccessShoppingList: true,
        canAccessAppointments: true,
        canAccessChat: true,
        canAccessGuides: true,
        canAccessProgress: true,
        canAccessWorkouts: true,
        canAccessDiary: true,

        // Features - TUTTO
        hasBasicPlan: true,
        hasWeeklyMenus: true,
        hasRecipes: true,
        hasAutomaticShoppingList: true,
        hasFollowUpIncluded: true,
        hasUnlimitedChat: true,
        hasPrioritySupport: true,
        hasAdvancedTracking: true,
        hasPremiumGuides: true,
        hasPersonalTrainer: true,

        // Limiti - MASSIMI
        validityDays: 90,
        followUpsIncluded: 2,
        ptSessionsIncluded: 8,
        chatMessagesPerMonth: -1, // Illimitati
        weeklyMenusPerMonth: -1, // Illimitati
        premiumGuidesCount: -1 // Tutte
      };

    case 'monthly_subscription':
      return {
        // Tabs Accessibili (8 tab attive)
        canAccessOverview: true,       // ✅ Panoramica
        canAccessProgress: true,        // ✅ Misure
        canAccessWeeklyMenu: true,      // ✅ Menù (4 menù/mese)
        canAccessGuides: true,          // ✅ Guide (solo gratuite)

        // Tabs BLOCCATE (serve consulenza)
        canAccessPlans: false,          // 🔒 Piano Nutrizionale
        canAccessRecipes: true,         // ✅ Ricette (10 settimanali)
        canAccessShoppingList: false,   // 🔒 Lista Spesa
        canAccessWorkouts: false,       // �� Allenamenti
        canAccessChat: false,           // 🔒 Chat
        canAccessAppointments: false,   // 🔒 Appuntamenti
        canAccessDiary: true,           // ✅ Diario Alimentare

        // Features
        hasBasicPlan: false,
        hasWeeklyMenus: true,           // 4 menù generici al mese
        hasRecipes: true,               // 10 ricette settimanali
        hasAutomaticShoppingList: false,
        hasFollowUpIncluded: false,
        hasUnlimitedChat: false,
        hasPrioritySupport: false,
        hasAdvancedTracking: false,
        hasPremiumGuides: false,
        hasPersonalTrainer: false,

        // Limiti
        validityDays: 30, // Rinnovo mensile
        followUpsIncluded: 0,
        ptSessionsIncluded: 0,
        chatMessagesPerMonth: 0, // No chat
        weeklyMenusPerMonth: 4, // 4 menù al mese
        premiumGuidesCount: 0
      };

    case 'guide_owner':
      return {
        // Only Library access for guide purchasers
        canAccessOverview: true,       // ✅ Solo per vedere info
        canAccessProgress: false,
        canAccessWeeklyMenu: false,
        canAccessGuides: true,         // ✅ Solo le guide acquistate
        canAccessPlans: false,
        canAccessRecipes: false,
        canAccessShoppingList: false,
        canAccessWorkouts: false,
        canAccessChat: false,
        canAccessAppointments: true,   // ✅ Può prenotare consulenza
        canAccessDiary: false,

        // No features except purchased guides
        hasBasicPlan: false,
        hasWeeklyMenus: false,
        hasRecipes: false,
        hasAutomaticShoppingList: false,
        hasFollowUpIncluded: false,
        hasUnlimitedChat: false,
        hasPrioritySupport: false,
        hasAdvancedTracking: false,
        hasPremiumGuides: false,       // Only purchased guides
        hasPersonalTrainer: false,

        // Limiti
        validityDays: 365, // Guide acquistate valide 1 anno
        followUpsIncluded: 0,
        ptSessionsIncluded: 0,
        chatMessagesPerMonth: 0,
        weeklyMenusPerMonth: 0,
        premiumGuidesCount: 0
      };

    default:
      // Nessuna subscription o expired
      return {
        canAccessOverview: true,
        canAccessPlans: false,
        canAccessRecipes: false,
        canAccessWeeklyMenu: false,
        canAccessShoppingList: false,
        canAccessAppointments: true,
        canAccessChat: false,
        canAccessGuides: true, // Solo overview
        canAccessProgress: true,
        canAccessWorkouts: false,
        canAccessDiary: false,

        hasBasicPlan: false,
        hasWeeklyMenus: false,
        hasRecipes: false,
        hasAutomaticShoppingList: false,
        hasFollowUpIncluded: false,
        hasUnlimitedChat: false,
        hasPrioritySupport: false,
        hasAdvancedTracking: false,
        hasPremiumGuides: false,
        hasPersonalTrainer: false,

        validityDays: 0,
        followUpsIncluded: 0,
        ptSessionsIncluded: 0,
        chatMessagesPerMonth: 0,
        weeklyMenusPerMonth: 0,
        premiumGuidesCount: 0
      };
  }
};

// Helper to get pricing from database (with fallback to defaults)
let cachedPricing: Record<string, number> | null = null;

export const loadPricing = async (): Promise<Record<string, number>> => {
  if (cachedPricing) return cachedPricing;

  try {
    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase
      .from('pricing_config')
      .select('subscription_type, price');

    if (error) throw error;

    const priceMap: Record<string, number> = {
      'basic': 97,
      'premium': 189,
      'complete': 399,
      'complete_coaching': 399,
      'monthly_subscription': 5.99,
      'follow_up': 50
    };

    data?.forEach(config => {
      priceMap[config.subscription_type] = parseFloat(config.price);
      if (config.subscription_type === 'complete_coaching') {
        priceMap['complete'] = parseFloat(config.price);
      }
    });

    cachedPricing = priceMap;
    return priceMap;
  } catch (error) {
    console.error('Error loading pricing:', error);
    return {
      'basic': 97,
      'premium': 189,
      'complete': 399,
      'complete_coaching': 399,
      'monthly_subscription': 5.99,
      'follow_up': 50
    };
  }
};

export const clearPricingCache = () => {
  cachedPricing = null;
};

export const getUpgradeOptions = (currentType: string | undefined) => {
  const current = currentType?.toLowerCase() || 'none';

  const prices = cachedPricing || {
    'basic': 97,
    'premium': 189,
    'complete': 399,
    'monthly_subscription': 5.99,
    'follow_up': 50
  };

  switch (current) {
    case 'basic':
      return [
        {
          id: 'monthly_subscription',
          title: 'Abbonamento Mensile',
          price: prices.monthly_subscription,
          validityDays: 30,
          benefits: [
            '4 menù settimanali completi (7gg × 5 pasti/giorno)',
            'Ricette stagionali con ingredienti freschi',
            'Lista spesa automatica organizzata per categorie',
            'Nuovi menù ogni settimana del mese',
            'Rinnovo automatico - Cancella quando vuoi',
            'Perfetto se vuoi solo i menù senza consulenza'
          ]
        },
        {
          id: 'premium',
          title: 'Piano Premium',
          price: prices.premium - prices.basic,
          validityDays: 60,
          benefits: [
            '4 menù settimanali completi (7gg × 5 pasti/giorno)',
            'Database ricette stagionali personalizzate',
            'Lista spesa automatica (17 categorie merceologiche)',
            '1 follow-up nutrizionale incluso (45 min)',
            'Chat assistenza: 50 messaggi/mese per 60 giorni',
            '2 guide digitali premium a scelta',
            'Validità totale: 60 giorni'
          ]
        },
        {
          id: 'complete',
          title: 'Piano Completo',
          price: prices.complete - prices.basic,
          validityDays: 90,
          benefits: [
            'Tutto del Piano Premium (menù, ricette, lista spesa, follow-up)',
            'Consulenza Personal Trainer dedicato',
            '8 sessioni PT online personalizzate',
            '+1 follow-up nutrizionista (totale 2)',
            'Chat da 50 msg/mese a ILLIMITATA per 90 giorni',
            'Tutte le guide digitali premium incluse',
            'Supporto prioritario e assistenza dedicata',
            '+30 giorni validità (totale 90 giorni)'
          ]
        }
      ];

    case 'premium':
      return [
        {
          id: 'complete',
          title: 'Piano Completo',
          price: prices.complete - prices.premium,
          validityDays: 90,
          benefits: [
            'Consulenza Personal Trainer dedicato',
            '8 sessioni PT online personalizzate',
            '+1 follow-up nutrizionista (totale 2 inclusi)',
            'Chat da 50 msg/mese a ILLIMITATA',
            'Tutte le guide digitali premium incluse',
            'Supporto prioritario e assistenza dedicata',
            '+30 giorni validità (totale 90 giorni)'
          ]
        }
      ];

    case 'complete':
      return []; // Già al massimo

    case 'monthly_subscription':
      return [
        {
          id: 'basic',
          title: 'Piano Base',
          price: prices.basic,
          validityDays: 30,
          benefits: [
            'Consulenza nutrizionale personalizzata (60 min)',
            'Piano nutrizionale completo su misura',
            'Valutazione antropometrica e misurazioni',
            'Chat assistenza: 10 messaggi per 30 giorni',
            'Accesso guide digitali gratuite',
            'Cancella abbonamento mensile automaticamente'
          ]
        },
        {
          id: 'premium',
          title: 'Piano Premium',
          price: prices.premium,
          validityDays: 60,
          benefits: [
            'Tutto del Piano Base (consulenza 60min + piano personalizzato)',
            '4 menù settimanali completi (7gg × 5 pasti)',
            'Database ricette stagionali personalizzate',
            'Lista spesa automatica (17 categorie)',
            '1 follow-up nutrizionale incluso (45 min)',
            'Chat assistenza: 50 messaggi/mese per 60 giorni',
            '2 guide digitali premium a scelta',
            'Cancella abbonamento mensile automaticamente'
          ]
        }
      ];

    default:
      return [
        {
          id: 'basic',
          title: 'Piano Base',
          price: prices.basic,
          validityDays: 30,
          benefits: [
            'Consulenza iniziale (60 min)',
            'Piano nutrizionale completo',
            'Valutazione e misurazioni',
            'Chat: 10 messaggi per 30 giorni',
            'Guide digitali gratuite'
          ]
        },
        {
          id: 'premium',
          title: 'Piano Premium',
          price: prices.premium,
          validityDays: 60,
          benefits: [
            'Tutto del Piano Base (consulenza 60min + piano personalizzato)',
            '4 menù settimanali completi (7gg × 5 pasti)',
            'Database ricette stagionali personalizzate',
            'Lista spesa automatica (17 categorie merceologiche)',
            '1 follow-up nutrizionale incluso (45 min)',
            'Chat assistenza: 50 messaggi/mese per 60 giorni',
            '2 guide digitali premium a scelta',
            'Validità: 60 giorni dalla consulenza'
          ]
        },
        {
          id: 'complete',
          title: 'Piano Completo',
          price: prices.complete,
          validityDays: 90,
          benefits: [
            'Tutto del Piano Premium (menù, ricette, lista spesa)',
            'Consulenza Personal Trainer dedicato',
            '8 sessioni PT online personalizzate',
            '2 follow-up nutrizionista inclusi (45 min ciascuno)',
            'Chat assistenza ILLIMITATA per 90 giorni',
            'Tutte le guide digitali premium incluse',
            'Supporto prioritario e assistenza dedicata',
            'Validità: 90 giorni dalla consulenza'
          ]
        },
        {
          id: 'monthly_subscription',
          title: 'Abbonamento Mensile',
          price: prices.monthly_subscription,
          validityDays: 30,
          benefits: [
            '4 menù settimanali completi (7gg × 5 pasti/giorno)',
            'Ricette stagionali con ingredienti freschi',
            'Lista spesa automatica organizzata per categorie',
            'Nuovi menù ogni settimana del mese',
            'Rinnovo automatico - Cancella quando vuoi'
          ]
        }
      ];
  }
};

export const getPlanName = (type: string | undefined): string => {
  switch (type?.toLowerCase()) {
    case 'basic':
      return 'Piano Base';
    case 'premium':
      return 'Piano Premium';
    case 'complete':
      return 'Piano Completo';
    case 'follow_up':
      return 'Follow-up';
    case 'monthly_subscription':
      return 'Abbonamento Mensile';
    case 'guide_owner':
      return 'Accesso Guide';
    default:
      return 'Nessun Piano';
  }
};

export const getPlanValidity = (type: string | undefined): number => {
  const features = getSubscriptionFeatures(type);
  return features.validityDays;
};

export const canAccessFeature = (
  subscriptionType: string | undefined,
  feature: keyof SubscriptionFeatures
): boolean => {
  const features = getSubscriptionFeatures(subscriptionType);
  return features[feature] as boolean;
};

// Check if subscription is expired
export const isSubscriptionExpired = (
  endDate: string | null | undefined
): boolean => {
  if (!endDate) return true;
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
};

// Check if subscription is active (includes cancelled but not yet expired)
export const isSubscriptionActive = (
  endDate: string | null | undefined,
  status?: string | null
): boolean => {
  if (!endDate) return false;

  const now = new Date();
  const end = new Date(endDate);

  // If subscription is cancelled but still within paid period, it's active
  if (status === 'cancelled' && now <= end) {
    return true;
  }

  // If subscription is active and not expired, it's active
  if (status === 'active' && now <= end) {
    return true;
  }

  // If no status provided, just check the date
  if (!status && now <= end) {
    return true;
  }

  return false;
};

// Check if user can generate menus (checks subscription status, trial, and expiry dates)
export const canGenerateMenus = (
  subscriptionType: string | undefined,
  subscriptionEndDate: string | null | undefined,
  subscriptionStatus?: string | null,
  trialEndDate?: string | null
): boolean => {
  const now = new Date();

  // Check if user is on trial
  if (subscriptionStatus === 'trial' && trialEndDate) {
    const trialEnd = new Date(trialEndDate);
    // If trial is still active, they can generate menus
    if (trialEnd > now) {
      return true;
    }
    // Trial expired, cannot generate
    return false;
  }

  // IMPORTANT: Allow access if subscription is cancelled but still within paid period
  if (subscriptionStatus === 'cancelled' && subscriptionEndDate) {
    const end = new Date(subscriptionEndDate);
    if (now <= end) {
      // Still within paid period, check if subscription type allows menus
      const features = getSubscriptionFeatures(subscriptionType);
      return features.hasWeeklyMenus && features.weeklyMenusPerMonth !== 0;
    }
    // Past end date, no access
    return false;
  }

  // Check paid subscription expiry
  if (isSubscriptionExpired(subscriptionEndDate)) {
    return false;
  }

  // Check if subscription type allows menu generation
  const features = getSubscriptionFeatures(subscriptionType);
  return features.hasWeeklyMenus && features.weeklyMenusPerMonth !== 0;
};

// Calculate days remaining
export const getDaysRemaining = (
  endDate: string | null | undefined
): number => {
  if (!endDate) return 0;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

// Get chat messages info
export const getChatMessagesInfo = (
  subscriptionType: string | undefined,
  messagesRemaining: number | null | undefined
): { total: number; remaining: number; isUnlimited: boolean } => {
  const features = getSubscriptionFeatures(subscriptionType);
  const isUnlimited = features.chatMessagesPerMonth === -1;

  return {
    total: isUnlimited ? -1 : features.chatMessagesPerMonth,
    remaining: messagesRemaining ?? 0,
    isUnlimited
  };
};

// Chat packages available for purchase
export const getChatPackages = () => [
  {
    id: 'mini',
    name: 'Mini',
    messages: 5,
    price: 5,
    pricePerMessage: 1.0,
    validityDays: 30
  },
  {
    id: 'standard',
    name: 'Standard',
    messages: 15,
    price: 12,
    pricePerMessage: 0.8,
    validityDays: 30,
    badge: 'Più Conveniente'
  },
  {
    id: 'maxi',
    name: 'Maxi',
    messages: 30,
    price: 20,
    pricePerMessage: 0.67,
    validityDays: 30,
    badge: 'Miglior Valore'
  }
];
