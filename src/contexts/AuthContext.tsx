import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  sendSignInOtp: (email: string) => Promise<{ error: string | null }>;
  verifySignInOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  sendSignUpOtp: (email: string) => Promise<{ error: string | null }>;
  verifySignUpOtp: (email: string, token: string, fullName: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // On first OAuth sign-in, create a profile if one doesn't exist yet
          if (event === 'SIGNED_IN') {
            await ensureProfile(session.user);
          }
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  }

  // Creates a profile row for OAuth users on their first sign-in
  async function ensureProfile(user: User) {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (existing) return;

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Student';

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email ?? '',
        full_name: fullName,
        role: 'student',
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
    } catch (e) {
      console.error('Error ensuring profile:', e);
    }
  }

  async function sendSignInOtp(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      if (error.message.toLowerCase().includes('user not found') ||
          error.message.toLowerCase().includes('no user')) {
        return { error: 'No account found with that email address.' };
      }
      return { error: error.message };
    }
    return { error: null };
  }

  async function verifySignInOtp(email: string, token: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function sendSignUpOtp(email: string): Promise<{ error: string | null }> {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (existing) return { error: 'An account with that email already exists. Please sign in.' };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function verifySignUpOtp(
    email: string,
    token: string,
    fullName: string,
    password: string,
  ): Promise<{ error: string | null }> {
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (verifyErr) return { error: verifyErr.message };

    const userId = data.user?.id;
    if (!userId) return { error: 'Verification succeeded but no user returned.' };

    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) console.warn('Could not set password:', pwErr.message);

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      role: 'student',
    });
    if (profileErr && profileErr.code !== '23505') {
      return { error: 'Account created but profile setup failed. Please contact support.' };
    }

    return { error: null };
  }

  async function signInWithGoogle(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      sendSignInOtp, verifySignInOtp,
      sendSignUpOtp, verifySignUpOtp,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
