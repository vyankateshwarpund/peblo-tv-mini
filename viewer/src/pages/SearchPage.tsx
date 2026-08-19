import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { viewerApi, getMediaUrl } from '../api/client';
import { CatalogueShow } from '../types';
import { Search as SearchIcon, Film, X } from 'lucide-react';

const CATEGORIES = [
  'adventure', 'animals', 'friendship', 'magic', 'science', 'bedtime',
  'family', 'nature', 'school', 'humour', 'emotions', 'rhymes',
  'counting', 'india', 'alphabet'
];

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [section, setSection] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query, category, language, section],
    queryFn: () => viewerApi.searchCatalogue({
      q: query || undefined,
      category: category || undefined,
      language: language || undefined,
      section: section || undefined,
    }),
    staleTime: 1000 * 30,
  });

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setLanguage('');
    setSection('');
  };

  const hasActiveFilters = Boolean(query || category || language || section);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Search Catalogue
        </h1>

        {/* Search Input Bar */}
        <div className="relative max-w-2xl">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shows, episodes, characters..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors shadow-xl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Composable Filters */}
        <div className="space-y-3 pt-2">
          {/* Languages & Sections */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Language:</span>
              <button
                onClick={() => setLanguage('')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  language === '' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  language === 'en' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  language === 'hi' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Hindi
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-0 sm:ml-4">
              <span className="text-xs font-semibold text-slate-400">Section:</span>
              {['', 'featured', 'series', 'songs', 'minisodes'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSection(sec)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize ${
                    section === sec ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec === '' ? 'All' : sec}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-400 hover:text-red-400 ml-auto flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-400 mr-1">Categories:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize transition-colors ${
                  category === cat
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {isLoading ? 'Searching...' : `Results (${results.length} shows found)`}
          </h2>
        </div>

        {results.length === 0 && !isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Film className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-sm">No shows match your current search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((show: CatalogueShow) => {
              const poster = getMediaUrl(show.artwork.poster);
              return (
                <Link
                  key={show.show_id}
                  to={`/show/${show.slug}`}
                  className="group cursor-pointer transition-transform duration-300 hover:scale-105"
                >
                  <div className="w-full aspect-[2/3] bg-slate-900 rounded-xl overflow-hidden shadow-lg relative border border-white/5 group-hover:border-red-500/50 transition-colors">
                    {poster ? (
                      <img
                        src={poster}
                        alt={show.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950">
                        <Film className="w-6 h-6 text-slate-700 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400 line-clamp-2">{show.title}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 mt-2 truncate group-hover:text-red-400 transition-colors">
                    {show.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 capitalize">{show.section}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
