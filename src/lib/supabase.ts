import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UserMeasurement {
  id: string;
  user_id: string;
  weight?: number;
  body_fat?: number;
  muscle_mass?: number;
  measurements?: any;
  notes?: string;
  recorded_at: string;
  created_at: string;
}

export interface NutritionalPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fats?: number;
  status: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MealTemplate {
  id: string;
  plan_id: string;
  meal_type: string;
  name: string;
  description?: string;
  target_calories?: number;
  notes?: string;
  order_index?: number;
  created_at: string;
}

export interface PlanFood {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  alternatives?: string[];
  order_index?: number;
  created_at: string;
  food_item?: FoodItem;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fats_per_100g?: number;
  fiber_per_100g?: number;
  unit?: string;
  created_at: string;
}

export interface PlanTip {
  id: string;
  plan_id: string;
  category: string;
  title: string;
  content: string;
  icon?: string;
  priority?: number;
  is_important?: boolean;
  created_at: string;
}

export interface PlanMeasurement {
  id: string;
  plan_id: string;
  measurement_date: string;
  weight?: number;
  height?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
  taken_by?: string;
  created_at: string;
}

// Profile Functions
export const getUserMeasurements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
  
  return { data, error }
}

export const addUserMeasurement = async (measurement: Omit<UserMeasurement, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('user_measurements')
    .insert([measurement])
    .select()
    .single()
  
  return { data, error }
}

// Nutritional Plans Functions
export const getUserNutritionalPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from('nutritional_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getPlanDetails = async (planId: string) => {
  // Get plan
  const { data: plan, error: planError } = await supabase
    .from('nutritional_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError) return { data: null, error: planError }

  // Get meals with foods
  const { data: meals, error: mealsError } = await supabase
    .from('meal_templates')
    .select(`
      *,
      plan_foods (
        *,
        food_items (*)
      )
    `)
    .eq('plan_id', planId)
    .order('order_index')

  // Get tips
  const { data: tips, error: tipsError } = await supabase
    .from('plan_tips')
    .select('*')
    .eq('plan_id', planId)
    .order('priority')

  // Get measurements
  const { data: measurements, error: measurementsError } = await supabase
    .from('plan_measurements')
    .select('*')
    .eq('plan_id', planId)
    .order('measurement_date', { ascending: false })

  return {
    data: {
      plan,
      meals: meals || [],
      tips: tips || [],
      measurements: measurements || []
    },
    error: mealsError || tipsError || measurementsError
  }
}