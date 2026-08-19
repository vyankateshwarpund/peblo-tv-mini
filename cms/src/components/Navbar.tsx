import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, clearToken } from '../api/client';
import { Tv, Film, CheckCircle2, Send, LayoutDashboard, LogOut, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shows', label: 'Shows & Episodes', icon: Film },
    { to: '/validation', label: 'Validation Report', icon: CheckCircle2 },
    { to: '/publish', label: 'Publish Catalogue', icon: Send },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 text-brand-500 font-bold text-xl tracking-wide">
            <Tv className="w-6 h-6 text-brand-500" />
            <span>PEBLO TV <span className="text-xs bg-brand-600/30 text-brand-400 px-2 py-0.5 rounded border border-brand-500/30">CMS</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 text-sm bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium text-xs leading-none">{user.email}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${user.role === 'admin' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
