import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      // Check for OAuth callback - either PKCE (code in search) or implicit (tokens in hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const authCode = urlParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      const isPKCECallback = !!authCode;
      const isImplicitCallback = !!(accessToken && refreshToken);

      try {
        let session: Session | null = null;
        let sessionUser: User | null = null;

        if (isPKCECallback) {
          // PKCE flow - exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode!);
          if (error) {
            console.error('PKCE exchange error:', error);
            if (mounted) setLoading(false);
            return;
          }
          session = data.session;
          sessionUser = data.session?.user ?? null;
          // Clean URL - remove code param
          window.history.replaceState(null, '', window.location.pathname);
        } else if (isImplicitCallback) {
          // Implicit flow - set session from tokens
          const { data, error } = await supabase.auth.setSession(accessToken!, refreshToken!);
          if (error) {
            console.error('Implicit session error:', error);
            if (mounted) setLoading(false);
            return;
          }
          session = data.session;
          sessionUser = data.session?.user ?? null;
          // Clean URL - remove hash
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          // Normal page load - get existing session
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          session = existingSession;
          sessionUser = existingSession?.user ?? null;
        }

        if (!mounted) return;

        if (sessionUser) {
          await ensureProfile(sessionUser);
          setSession(session);
          setUser(sessionUser);
          await fetchProfile(sessionUser.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Auth callback error:', e);
        if (mounted) setLoading(false);
      }
    }

    handleAuthCallback();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            await ensureProfile(session.user);
          }
          await fetchProfile(session.user.id);
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
