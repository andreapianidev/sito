// OpenAI Integration for Menu and Recipe Generation

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface MenuGenerationRequest {
  userId: string;
  planId: string;
  userProfile: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    activity_level?: string;
    dietary_preferences: string[];
    allergies: string[];
    medical_conditions: string[];
    goals: string[];
  };
  nutritionalTargets: {
    daily_calories?: number;
    daily_protein?: number;
    daily_carbs?: number;
    daily_fats?: number;
  };
  preferences?: {
    cuisine_style?: string;
    cooking_time?: string;
    difficulty?: string;
    budget?: string;
  };
}

export interface RecipeGenerationRequest {
  dish_name: string;
  servings: number;
  dietary_restrictions?: string[];
  allergies?: string[];
  cooking_time?: string;
  difficulty?: string;
  cuisine_style?: string;
  nutritional_targets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
}

export interface GeneratedMenu {
  weekly_menu: {
    [day: string]: {
      [meal: string]: {
        name: string;
        foods: Array<{
          name: string;
          quantity: number;
          unit: string;
          calories: number;
        }>;
        recipe: string;
        total_calories: number;
      };
    };
  };
  tips: Array<{
    category: string;
    title: string;
    content: string;
    icon: string;
    priority: number;
    is_important: boolean;
  }>;
  shopping_list: {
    [category: string]: string[];
  };
  nutritional_summary: {
    avg_daily_calories: number;
    avg_daily_protein: number;
    avg_daily_carbs: number;
    avg_daily_fats: number;
  };
}

export interface GeneratedRecipe {
  recipe: {
    name: string;
    description: string;
    servings: number;
    prep_time: string;
    cook_time: string;
    total_time: string;
    difficulty: string;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      notes?: string;
    }>;
    instructions: string[];
    nutritional_info: {
      per_serving: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
      total: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    };
    tips: string[];
    variations: string[];
    wine_pairing?: string;
    storage: string;
    tags: string[];
  };
}

// Genera menù settimanale personalizzato
export const generateWeeklyMenu = async (request: MenuGenerationRequest): Promise<GeneratedMenu> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-menu`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Errore nella generazione del menù: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Errore nella generazione del menù');
  }

  return result.data;
};

// Genera ricetta singola
export const generateRecipe = async (request: RecipeGenerationRequest): Promise<GeneratedRecipe> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-recipe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Errore nella generazione della ricetta: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Errore nella generazione della ricetta');
  }

  return result.data;
};

// Calcola età da data di nascita
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Calcola BMR (Metabolismo Basale) usando formula Mifflin-St Jeor
export const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Calcola TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);
};

// Calcola distribuzione macronutrienti
export const calculateMacros = (calories: number, goal: string) => {
  let proteinPercent = 0.25; // 25% default
  let carbPercent = 0.45;    // 45% default  
  let fatPercent = 0.30;     // 30% default

  switch (goal) {
    case 'perdita_peso':
      proteinPercent = 0.30;
      carbPercent = 0.35;
      fatPercent = 0.35;
      break;
    case 'massa_muscolare':
      proteinPercent = 0.35;
      carbPercent = 0.40;
      fatPercent = 0.25;
      break;
    case 'mantenimento':
      proteinPercent = 0.25;
      carbPercent = 0.45;
      fatPercent = 0.30;
      break;
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 kcal per grammo
    carbs: Math.round((calories * carbPercent) / 4),     // 4 kcal per grammo
    fats: Math.round((calories * fatPercent) / 9)        // 9 kcal per grammo
  };
};

// Suggerimenti per migliorare il prompt basati sui dati utente
export const getPromptEnhancements = (userProfile: any) => {
  const enhancements = [];

  if (userProfile.medical_conditions?.includes('diabete')) {
    enhancements.push('Privilegia alimenti a basso indice glicemico');
  }
  
  if (userProfile.medical_conditions?.includes('ipertensione')) {
    enhancements.push('Riduci il sodio e privilegia erbe aromatiche');
  }
  
  if (userProfile.goals?.includes('perdita_peso')) {
    enhancements.push('Aumenta la sazietà con fibre e proteine');
  }
  
  if (userProfile.activity_level === 'very_active') {
    enhancements.push('Aumenta i carboidrati nei giorni di allenamento');
  }

  return enhancements;
};