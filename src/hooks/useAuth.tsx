import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { handleDailyLogin } from '../utils/gamificationUtils';

interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  dietary_preferences?: string[];
  allergies?: string[];
  medical_conditions?: string[];
  goals?: string[];
  role?: string;
  subscription_type?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>, targetUser?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const activeProfileRequestRef = useRef(0);

  const loadProfile = async (userId: string) => {
    const requestId = ++activeProfileRequestRef.current;

    try {
      console.log('🔍 Loading profile for user:', userId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (requestId !== activeProfileRequestRef.current) {
        return;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, creating new profile...');

          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              id: userId,
              full_name: 'Utente',
              subscription_type: 'basic',
              subscription_status: 'inactive'
            }])
            .select()
            .single();

          if (requestId !== activeProfileRequestRef.current) {
            return;
          }

          if (createError) {
            console.error('❌ Error creating profile:', createError);
            console.log('⚠️ Could not create profile, user will need to complete registration');
            setProfile(null);
            return;
          }

          console.log('✅ New profile created:', newProfile);
          setProfile(newProfile);
        } else {
          console.error('❌ Error loading profile:', error);
          console.log('⚠️ Profile load error, continuing without profile');
          setProfile(null);
        }
        return;
      }

      console.log('✅ Profile loaded:', data);
      setProfile(data);
    } catch (err) {
      if (requestId !== activeProfileRequestRef.current) {
        return;
      }

      console.error('❌ Exception loading profile:', err);
      console.log('⚠️ Profile load exception, continuing without profile');
      setProfile(null);
    }
  };

  // Initialize once
  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('🔐 Session found, loading profile for user:', session.user.id);
          setUser(session.user);
          await loadProfile(session.user.id);
          handleDailyLogin(session.user.id);
        } else {
          console.log('🔐 No session found');
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        setError('Errore di inizializzazione');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, [initialized]);

  // Listen for auth changes
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_OUT' || !session?.user) {
        activeProfileRequestRef.current += 1;
        setUser(null);
        setProfile(null);
        setError(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);

        if (event === 'SIGNED_IN') {
          await loadProfile(session.user.id);
          handleDailyLogin(session.user.id);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        if (event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          await loadProfile(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('🔵 SignUp called with:', { email, fullName });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    console.log('🔵 SignUp result:', { data: data?.user?.id, error });
    return { data, error };
  };

  const signOut = async () => {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('session_not_found') || message.includes('Supabase request failed')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    try {
      await supabase.auth.signOut();
    } catch (err) {
      // no-op
    } finally {
      console.error = originalConsoleError;
    }

    activeProfileRequestRef.current += 1;
    setUser(null);
    setProfile(null);
    setError(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>, targetUser?: User) => {
    const currentUser = targetUser || user;

    if (!currentUser) {
      console.error('❌ Cannot update profile: no user provided');
      return;
    }

    console.log('🔄 updateProfile called with:', updates);
    console.log('👤 Target user:', currentUser.id);
    console.log('📋 Current profile:', profile);

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (checkError) {
        console.error('❌ Profile check error:', checkError);

        if (checkError.code === 'PGRST116') {
          console.log('🔄 Profile does not exist, creating it first...');

          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utente',
              subscription_type: 'basic',
              subscription_status: 'inactive',
              ...updates
            }])
            .select()
            .single();

          if (createError) {
            console.error('❌ Profile creation error:', createError);
            throw new Error('Errore nella creazione del profilo: ' + createError.message);
          }

          console.log('✅ Profile created successfully:', newProfile);
          setProfile(newProfile);
          return;
        }

        throw new Error('Errore nel controllo del profilo: ' + checkError.message);
      }

      console.log('✅ Existing profile found:', existingProfile);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Profile update error:', error);
        throw new Error('Errore nell\'aggiornamento del profilo: ' + error.message);
      } else {
        console.log('✅ Profile updated successfully:', data);
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ Profile update exception:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};