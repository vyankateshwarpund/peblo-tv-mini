import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HomePage } from '../pages/HomePage';
import { ShowDetailPage } from '../pages/ShowDetailPage';
import { WatchPage } from '../pages/WatchPage';
import { SearchPage } from '../pages/SearchPage';

export const AppRouter: React.FC = () => {
  const location = useLocation();
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
