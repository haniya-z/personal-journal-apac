import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Compass, Moon, Loader2 } from 'lucide-react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  signInWithGoogle, 
  loginAsGuest 
} from '../lib/firebaseClient';
import { soundFx } from '../utils/audio';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('haniya2078@gmail.com');
  const [password, setPassword] = useState('SanctuaryPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(cleanEmail, password);
      } else {
        await loginWithEmail(cleanEmail, password);
      }
      onSuccess?.();
    } catch (err: any) {
      console.warn('Firebase Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check credentials.';
      if (err.code === 'auth/operation-not-allowed' || msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('ADMIN_ONLY_OPERATION')) {
        msg = 'Email/Password sign-in is not enabled on this Firebase project. Please click "Google" below to sign in.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you are new, please click "Create an Account" below or sign in with Google.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already registered. Please click "Sign In" instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    soundFx.playClick();
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.warn('Google Auth error:', err);
      setError(err.message || 'Google sign in failed or popup was closed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    soundFx.playClick();
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
      onSuccess?.();
    } catch (err: any) {
      console.warn('Guest Auth error:', err);
      if (err.message?.includes('ADMIN_ONLY_OPERATION') || err.code === 'auth/operation-not-allowed') {
        setError('Anonymous sign-in is disabled in this Firebase project. Please click "Google" to sign in.');
      } else {
        setError(err.message || 'Guest sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#050508] relative overflow-hidden font-sans text-[#e0e0e0]">
      {/* Background Animated Stardust & Celestial Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Logo & Headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-amber-400 mb-3 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-white">
              Astral Sanctuary
            </h1>
            <p className="text-white/50 text-[11px] mt-1.5 uppercase tracking-widest font-mono">
              Firebase Authenticated Mythical Hatchery
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="auth-email" className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="traveler@domain.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl text-white placeholder-white/25 text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl text-white placeholder-white/25 text-sm transition-all outline-none font-mono"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Sanctuary Account' : 'Sign In with Firebase'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-4 cursor-pointer font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'New Traveler? Create an Account'}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
              <span className="bg-[#0b0c14] px-2 text-white/40">Alternative Options</span>
            </div>
          </div>

          {/* Google and Guest Sign In */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.77 14.77 1 12 1 7.42 1 3.49 3.58 1.55 7.34l3.65 2.83C6.11 7.07 8.81 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.16-1.99 3.42-4.93 3.42-8.68z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.2 14.83a7.1 7.1 0 0 1 0-4.66L1.55 7.34a11.97 11.97 0 0 0 0 10.32l3.65-2.83z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.08.72-2.45 1.16-4.24 1.16-3.19 0-5.89-2.07-6.8-5.17L1.55 16.05C3.49 19.81 7.42 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              id="guest-signin-btn"
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guest Demo</span>
            </button>
          </div>

          {/* Security & Feature Badges */}
          <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[10px] text-white/40 font-mono uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <Compass className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span>AI Planner</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <Flame className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span>Server XP</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <Moon className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span>Firestore</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
