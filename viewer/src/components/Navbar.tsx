import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Tv, Menu, X, User, Bookmark, LogOut, ExternalLink, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = () => {
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Featured', path: '/search?section=featured' },
    { label: 'Series', path: '/search?section=series' },
    { label: 'Songs', path: '/search?section=songs' },
    { label: 'Minisodes', path: '/search?section=minisodes' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0b0b0f]/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-white/5'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-wider text-red-600 group">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5 fill-white" />
            </div>
            <span>
              PEBLO<span className="text-white text-lg font-light ml-1">TV</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? location.pathname === '/' && !location.search
                  : location.pathname + location.search === link.path;

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`transition-colors py-1 relative ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search & Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Expandable Search Bar */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, songs..."
                  autoFocus
                  className="bg-slate-900/90 border border-slate-700 text-xs text-white rounded-full py-1.5 pl-8 pr-8 w-48 sm:w-64 focus:outline-none focus:border-red-500 transition-all shadow-inner"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Interactive Netflix Profile Avatar & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-1.5 focus:outline-none group p-1"
              title="Profile & Settings"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-transform border border-white/20">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/15 rounded-2xl shadow-2xl z-50 py-2 divide-y divide-white/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[130px]">
                        {user?.name || 'Peblo Explorer'}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[130px]">
                        {user?.email || 'Active Viewer'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-red-500" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <Link
                    to="/profile?tab=mylist"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span>My Saved List</span>
                  </Link>

                  <a
                    href="http://localhost:5173"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tv className="w-4 h-4 text-blue-400" />
                      <span>CMS Studio</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-1.5"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0b0b0f]/95 border-b border-white/10 px-4 py-4 space-y-3 backdrop-blur-lg">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, songs..."
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </form>

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-red-400 hover:text-red-300 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>My Profile & Settings</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="text-sm font-semibold text-red-400 hover:text-red-300 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
