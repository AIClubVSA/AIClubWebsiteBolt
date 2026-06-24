import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
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
  authError: string | null;
  clearAuthError: () => void;
  sendSignInOtp: (email: string) => Promise<{ error: string | null }>;
  verifySignInOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
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
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Creates a profile row for OAuth users on their first sign-in
  const ensureProfile = useCallback(async (user: User) => {
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
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
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
      setProfile(null);
    }
  }, []);

  // ---- Auth init effect ----
  // We do ALL auth state resolution here in one linear flow so
  // loading is guaranteed to end. The onAuthStateChange listener
  // only updates state after this init completes.
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Handle OAuth callback (PKCE or implicit)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        if (errorParam) {
          setAuthError(decodeURIComponent(errorDescription || errorParam || 'OAuth authentication failed'));
          window.history.replaceState(null, '', window.location.pathname);
          if (mounted) setLoading(false);
          return;
        }

        const authCode = urlParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        let currentSession: Session | null = null;

        if (authCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
          if (error) {
            setAuthError(error.message);
            if (mounted) setLoading(false);
            return;
          }
          currentSession = data.session;
          window.history.replaceState(null, '', window.location.pathname);
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession(accessToken, refreshToken);
          if (error) {
            setAuthError(error.message);
            if (mounted) setLoading(false);
            return;
          }
          currentSession = data.session;
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          currentSession = existingSession;
        }

        if (!mounted) return;

        // 2. Set user/session state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // 3. Fetch or create profile
        if (currentSession?.user) {
          await ensureProfile(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        setAuthError(e instanceof Error ? e.message : 'Authentication failed');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // After init, listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        if (!mounted) return;

        setSession(sess);
        setUser(sess?.user ?? null);

        if (sess?.user) {
          if (event === 'SIGNED_IN') {
            await ensureProfile(sess.user);
          }
          await fetchProfile(sess.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile, fetchProfile]);

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

  async function signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Invalid email or password.' };
      }
      return { error: error.message };
    }
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
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, authError, clearAuthError,
      sendSignInOtp, verifySignInOtp,
      signInWithPassword,
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
