import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
        },
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  checkSession: async () => {
    try {
      const isDummy = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (isDummy) {
        console.warn('⚠️ Supabase URL or Key missing. Using mock user for UI testing.');
        set({
          user: {
            id: 'mock-user-id',
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'admin',
          },
          loading: false,
        });
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Supabase session error:', error.message);
        set({ user: null, loading: false });
        return;
      }

      if (!data.session) {
        console.info('ℹ️ No active Supabase session.');
        set({ user: null, loading: false });
        return;
      }

      console.log('✅ Active Supabase session found for:', data.session.user.email);

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch user profile:', profileError.message);
      }

      set({
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: profile?.name,
          role: profile?.role,
        },
        loading: false,
      });
    } catch (error) {
      console.error('❌ Unexpected session check error:', error);
      set({ user: null, loading: false });
    }
  },
}));
