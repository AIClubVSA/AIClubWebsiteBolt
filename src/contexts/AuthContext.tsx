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
  // Sign-in flow: send OTP → verify OTP (signs in automatically)
  sendSignInOtp: (email: string) => Promise<{ error: string | null }>;
  verifySignInOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  // Sign-up flow: send OTP → verify OTP → create profile
  sendSignUpOtp: (email: string) => Promise<{ error: string | null }>;
  verifySignUpOtp: (email: string, token: string, fullName: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OTP_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/otp`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function checkEmailExists(email: string): Promise<{ exists: boolean; error: string | null }> {
  const res = await fetch(`${OTP_FUNCTION_URL}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      Apikey: ANON_KEY,
    },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) return { exists: false, error: json.error || 'Request failed' };
  return { exists: json.exists, error: null };
}

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
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

  async function sendSignInOtp(email: string): Promise<{ error: string | null }> {
    // Verify account exists first (friendly error, not a security gate)
    const { exists, error: checkErr } = await checkEmailExists(email);
    if (checkErr) return { error: checkErr };
    if (!exists) return { error: 'No account found with that email address.' };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function verifySignInOtp(email: string, token: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function sendSignUpOtp(email: string): Promise<{ error: string | null }> {
    // Check email is not already registered
    const { exists, error: checkErr } = await checkEmailExists(email);
    if (checkErr) return { error: checkErr };
    if (exists) return { error: 'An account with that email already exists. Please sign in.' };

    // Use signInWithOtp with shouldCreateUser: true — Supabase sends a 6-digit code
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
    // Verify the OTP — this creates the auth.users row and signs in
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (verifyErr) return { error: verifyErr.message };

    const userId = data.user?.id;
    if (!userId) return { error: 'Verification succeeded but no user returned.' };

    // Set the password so the user can also use password-based sign-in later if needed
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) console.warn('Could not set password:', pwErr.message);

    // Create profile
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

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      sendSignInOtp, verifySignInOtp,
      sendSignUpOtp, verifySignUpOtp,
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
