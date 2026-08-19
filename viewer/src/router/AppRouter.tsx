import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { HomePage } from '../pages/HomePage';
import { ShowDetailPage } from '../pages/ShowDetailPage';
import { WatchPage } from '../pages/WatchPage';
import { SearchPage } from '../pages/SearchPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AuthGatePage } from '../pages/AuthGatePage';

export const AppRouter: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Mandatory Authentication Gate: if user is not signed in, show AuthGatePage
  if (!user) {
    return <AuthGatePage />;
  }

  const isWatchPage = location.pathname.startsWith('/watch');

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-slate-100 flex flex-col justify-between">
      {!isWatchPage && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/show/:slug" element={<ShowDetailPage />} />
          <Route path="/watch/:slug" element={<WatchPage />} />
          <Route path="/watch/:slug/:contentGroup" element={<WatchPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      {!isWatchPage && (
        <footer className="border-t border-slate-900 bg-black py-8 text-center text-xs text-slate-500">
          <p>Peblo TV Mini — Streaming Surface · Powered by Atomic Catalogue Pipeline</p>
        </footer>
      )}
    </div>
  );
};
