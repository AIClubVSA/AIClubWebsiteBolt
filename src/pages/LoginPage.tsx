import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const OTP_LENGTH = 8;
const EMPTY_OTP = Array(OTP_LENGTH).fill('');

type Step = 'email' | 'otp';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendSignInOtp, verifySignInOtp, signInWithGoogle, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  // Show OAuth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  function startCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
    // On success, the browser redirects — no need to setLoading(false)
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await sendSignInOtp(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setStep('otp');
    startCooldown();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) verifyCode(next.join(''));
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      const digits = text.split('');
      setOtp(digits);
      verifyCode(text);
    }
  };

  const verifyCode = async (code: string) => {
    setError(null);
    setLoading(true);
    const { error } = await verifySignInOtp(email, code);
    setLoading(false);
    if (error) {
      setError(error);
      setOtp([...EMPTY_OTP]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
      return;
    }
    navigate('/dashboard');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyCode(otp.join(''));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    const { error } = await sendSignInOtp(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setOtp([...EMPTY_OTP]);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
    startCooldown();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/images/WhatsApp_Image_2026-06-03_at_5.22.16_PM.jpeg" className="w-10 h-10 object-contain rounded-lg" alt="AI Club" />
            <span className="text-xl font-bold text-white">AI Centre</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'email' ? 'Welcome back' : 'Check your email'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 'email'
              ? 'Sign in to access your dashboard'
              : `We sent an 8-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 'email' && (
            <>
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 mb-5"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0a0a0f] px-3 text-xs text-gray-500 uppercase tracking-wider">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending code...</> : 'Send verification code'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  Enter the 8-digit code
                </label>
                <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-10 h-13 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors"
                      style={{ height: '3.25rem' }}
                    />
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              <div className="space-y-3">
                <button type="submit" disabled={loading || otp.some((d) => !d)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-5 h-5" /> Verify &amp; Sign In</>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50">
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => { setStep('email'); setOtp([...EMPTY_OTP]); setError(null); }}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Change email
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign up</Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">Part of Vidyashilp Academy</p>
      </div>
    </div>
  );
}
