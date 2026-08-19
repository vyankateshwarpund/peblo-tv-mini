import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { viewerApi, getMediaUrl } from '../api/client';
import {
  User,
  Settings,
  Bookmark,
  Shield,
  LogOut,
  Sparkles,
  Tv,
  Film,
  Check,
  Play,
  Sliders,
  ExternalLink
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'profile' | 'mylist' | 'settings') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'mylist' | 'settings'>(initialTab);

  // Profile local state
  const [profileName, setProfileName] = useState(user?.name || 'Peblo Explorer');
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi'>('hi');
  const [streamQuality, setStreamQuality] = useState<'1080p' | '4k' | 'auto'>('1080p');
  const [maturityRating, setMaturityRating] = useState('U/A 7+');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: catalogue } = useQuery({
    queryKey: ['catalogue'],
    queryFn: viewerApi.getCatalogue,
  });

  const allShows = Object.values(catalogue?.sections || {}).flat();
  const mySavedShows = allShows.slice(0, 4);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-24 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-red-600/30 border border-white/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{profileName}</h1>
              <span className="bg-red-600/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Kids Profile
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.email || 'Personalized Streaming & Family Safety Controls'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="bg-slate-900 hover:bg-red-600/90 border border-slate-800 hover:border-red-600 text-slate-300 hover:text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto shadow"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-sm font-bold pb-2 transition-colors flex items-center gap-2 relative ${
            activeTab === 'profile'
              ? 'text-white border-b-2 border-red-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account & Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('mylist')}
          className={`text-sm font-bold pb-2 transition-colors flex items-center gap-2 relative ${
            activeTab === 'mylist'
              ? 'text-white border-b-2 border-red-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My List ({mySavedShows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`text-sm font-bold pb-2 transition-colors flex items-center gap-2 relative ${
            activeTab === 'settings'
              ? 'text-white border-b-2 border-red-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Playback & Safety</span>
        </button>
      </div>

      {/* Tab 1: Profile & Account Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Profile preferences saved successfully!</span>
            </div>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-red-500" />
              <span>Profile Details</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Profile Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Default Audio Language</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredLang('hi')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    preferredLang === 'hi'
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Hindi [Original]
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang('en')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    preferredLang === 'en'
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  English [Audio]
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Video Streaming Quality</label>
              <select
                value={streamQuality}
                onChange={(e) => setStreamQuality(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="1080p">Full HD 1080p (Recommended)</option>
                <option value="4k">Ultra HD 4K (High Bandwidth)</option>
                <option value="auto">Auto (Data Saver)</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-lg shadow-red-600/30"
            >
              Save Preferences
            </button>
          </div>

          {/* Quick CMS Link */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-red-500" />
                <span>Internal Content Studio (CMS)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage shows, upload artworks, and publish catalogue versions.
              </p>
            </div>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <span>Open Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      )}

      {/* Tab 2: My List */}
      {activeTab === 'mylist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Saved Watchlist</h2>
            <span className="text-xs text-slate-400">{mySavedShows.length} Shows Saved</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mySavedShows.map((show) => {
              const bannerUrl = getMediaUrl(show.artwork.banner);
              const posterUrl = getMediaUrl(show.artwork.poster);
              const firstEp = show.seasons?.[0]?.episodes?.[0] || show.trailers?.[0];

              return (
                <div
                  key={show.show_id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden group hover:border-red-500/60 transition-all flex flex-col justify-between"
                >
                  <div className="w-full aspect-[16/9] bg-slate-950 relative overflow-hidden">
                    {bannerUrl || posterUrl ? (
                      <img
                        src={bannerUrl || posterUrl}
                        alt={show.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950">
                        <Film className="w-6 h-6 text-slate-700" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link
                        to={firstEp ? `/watch/${show.slug}/${firstEp.content_group}` : `/show/${show.slug}`}
                        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <Link
                      to={`/show/${show.slug}`}
                      className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate block"
                    >
                      {show.title}
                    </Link>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize">{show.section}</span>
                      <span className="text-emerald-400 font-semibold">98% Match</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Playback & Safety */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Family Safety & Content Filters</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Maturity Level Filter</label>
              <select
                value={maturityRating}
                onChange={(e) => setMaturityRating(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="All Ages">All Ages (Preschool & Nursery Rhymes)</option>
                <option value="U/A 7+">U/A 7+ (General Kids & Animated Fables)</option>
                <option value="U/A 13+">U/A 13+ (All Shows & Documentaries)</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Peblo Safe Stream Active</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                All catalogue content is validated for age-appropriate language, certified educational value, and safe playback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
