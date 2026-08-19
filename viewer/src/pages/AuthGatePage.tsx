import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tv, ArrowRight, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

export const AuthGatePage: React.FC = () => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    const userName = isSignUp ? name.trim() : email.split('@')[0];
    login({ email, name: userName });
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Cinematic Background Backdrop with Vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-transform duration-10000"
        style={{
          backgroundImage: `url('/storage/moti_main_banner.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/80 to-black/90" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/60 to-[#0b0b0f]" />

      {/* Header Bar */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-black text-2xl sm:text-3xl tracking-wider text-red-600">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/40">
            <Tv className="w-5 h-5 fill-white" />
          </div>
          <span>
            PEBLO<span className="text-white text-xl font-light ml-1">TV</span>
          </span>
        </div>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg('');
          }}
          className="bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold py-2 px-5 rounded-lg transition-colors shadow-md shadow-red-600/30"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-20 flex items-center justify-center px-4 py-8">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isSignUp ? 'Create your account' : 'Sign In'}
            </h1>
            <p className="text-xs text-slate-400">
              {isSignUp
                ? 'Watch unlimited animated series, rhymes, and stories.'
                : 'Welcome back! Sign in to continue watching.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold rounded-xl animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-0"
                />
                <span>Remember me</span>
              </label>
              <span className="hover:underline cursor-pointer text-slate-400">Need help?</span>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-red-600/30 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>{isSignUp ? 'Sign Up & Start Watching' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-xs text-slate-400 text-center pt-2 border-t border-white/10">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMsg('');
                  }}
                  className="text-white font-bold hover:underline"
                >
                  Sign in now
                </button>
              </span>
            ) : (
              <span>
                New to Peblo TV?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                  }}
                  className="text-white font-bold hover:underline"
                >
                  Sign up now
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-black/60 py-6 text-center text-xs text-slate-500">
        <p>Questions? Call 1-800-PEBLO-TV · Privacy Policy · Terms of Use</p>
      </footer>
    </div>
  );
};
