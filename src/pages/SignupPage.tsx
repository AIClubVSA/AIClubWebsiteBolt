import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, User, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const OTP_LENGTH = 8;
const EMPTY_OTP = Array(OTP_LENGTH).fill('') as string[];

type Step = 'form' | 'otp';

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState<string[]>([...EMPTY_OTP]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendSignUpOtp, verifySignUpOtp } = useAuth();
  const navigate = useNavigate();

  function startCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await sendSignUpOtp(email);
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
    if (next.every((d) => d !== '')) completeSignup(next.join(''));
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) { setOtp(text.split('')); completeSignup(text); }
  };

  const completeSignup = async (code: string) => {
    setError(null);
    setLoading(true);
    const { error } = await verifySignUpOtp(email, code, fullName, password);
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
    await completeSignup(otp.join(''));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    const { error } = await sendSignUpOtp(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
    startCooldown();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <Brain className="w-10 h-10 text-cyan-400" />
            <span className="text-xl font-bold text-white">AI Centre</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'form' ? 'Create account' : 'Verify your email'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 'form'
              ? 'Join the AI Centre at Vidyashilp Academy'
              : `Enter the 8-digit code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    required autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Your full name" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="you@gmail.com" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Minimum 6 characters" />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Confirm your password" />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  <span className="text-cyan-400 font-medium">Email verification required. </span>
                  An 8-digit code will be sent to your email to complete registration.
                </p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending code...</> : 'Continue'}
              </button>
            </form>
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
                      className="w-10 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-colors"
                      style={{ height: '3.25rem' }}
                    />
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Creating your account...</span>
                </div>
              )}

              <div className="space-y-3">
                <button type="submit" disabled={loading || otp.some((d) => !d)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : <><ShieldCheck className="w-5 h-5" /> Verify &amp; Create Account</>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors disabled:opacity-50">
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => { setStep('form'); setOtp([...EMPTY_OTP]); setError(null); }}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to form
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">Part of Vidyashilp Academy</p>
      </div>
    </div>
  );
}
