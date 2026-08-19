import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Tv, Compass, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-all backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-wider text-red-600">
            <Tv className="w-7 h-7 text-red-600" />
            <span>PEBLO<span className="text-white text-lg font-light ml-1">TV</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/" className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-white font-bold' : ''}`}>
              Home
            </Link>
            <Link to="/search?section=featured" className="hover:text-white transition-colors">
              Featured
            </Link>
            <Link to="/search?section=series" className="hover:text-white transition-colors">
              Series
            </Link>
            <Link to="/search?section=songs" className="hover:text-white transition-colors">
              Songs
            </Link>
            <Link to="/search?section=minisodes" className="hover:text-white transition-colors">
              Minisodes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="flex items-center gap-2 text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Search catalogue"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
