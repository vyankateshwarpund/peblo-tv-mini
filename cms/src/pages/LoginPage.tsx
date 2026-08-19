import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Tv, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.data?.detail?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'editor') => {
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('adminpassword123');
    } else {
      setEmail('editor@example.com');
      setPassword('editorpassword123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Peblo TV CMS</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage shows, episodes, and publish catalogue</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center mb-3">Quick Fill Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs py-2 px-3 rounded-lg font-medium border border-amber-500/20 transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('editor')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs py-2 px-3 rounded-lg font-medium border border-cyan-500/20 transition-colors"
            >
              Editor Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
