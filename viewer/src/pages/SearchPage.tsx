import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { viewerApi, getMediaUrl } from '../api/client';
import { CatalogueShow } from '../types';
import { Search as SearchIcon, Film, X, Star, Play } from 'lucide-react';

const CATEGORIES = [
  'adventure', 'folk', 'friendship', 'india', 'language', 'learning',
  'maths', 'music', 'nature', 'reading', 'science', 'singalong',
  'stories', 'travel', 'values'
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const language = searchParams.get('language') || '';
  const section = searchParams.get('section') || '';

  const updateFilters = (updates: Partial<{ q: string; category: string; language: string; section: string }>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        newParams.set(key, val);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query, category, language, section],
    queryFn: () =>
      viewerApi.searchCatalogue({
        q: query || undefined,
        category: category || undefined,
        language: language || undefined,
        section: section || undefined,
      }),
    staleTime: 1000 * 30,
  });

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(query || category || language || section);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-24 space-y-8 animate-in fade-in duration-200">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Browse & Search Catalogue
        </h1>

        {/* Search Input Bar */}
        <div className="relative max-w-2xl">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Search shows, episodes, characters..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors shadow-xl"
          />
          {query && (
            <button
              onClick={() => updateFilters({ q: '' })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Composable Filters */}
        <div className="space-y-4 pt-2">
          {/* Languages & Sections */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Language:</span>
              <button
                onClick={() => updateFilters({ language: '' })}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  language === '' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => updateFilters({ language: 'en' })}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  language === 'en' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => updateFilters({ language: 'hi' })}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  language === 'hi' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Hindi
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Section:</span>
              {['', 'featured', 'series', 'songs', 'minisodes'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => updateFilters({ section: sec })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    section === sec ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
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
                onClick={() => updateFilters({ category: category === cat ? '' : cat })}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full capitalize transition-colors ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {results.map((show: CatalogueShow) => {
              const poster = getMediaUrl(show.artwork.poster);
              const banner = getMediaUrl(show.artwork.banner);
              const totalEps =
                (show.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0) +
                (show.trailers?.length || 0);

              return (
                <Link
                  key={show.show_id}
                  to={`/show/${show.slug}`}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-red-500/60 transition-all flex flex-col group hover:scale-[1.03] duration-300 shadow-xl"
                >
                  <div className="w-full aspect-[16/9] bg-slate-950 relative overflow-hidden">
                    {banner || poster ? (
                      <img
                        src={banner || poster}
                        alt={show.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950">
                        <Film className="w-6 h-6 text-slate-700 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400 line-clamp-2">{show.title}</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur text-[10px] font-bold text-slate-200 px-2 py-0.5 rounded">
                      {totalEps} eps
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-red-500">
                        <span>{show.section}</span>
                        <span className="text-emerald-400 font-semibold normal-case">98% match</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-red-400 transition-colors line-clamp-1 mt-1">
                        {show.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {show.synopsis || 'Explore episodes on Peblo TV.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-800">
                      {show.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="bg-slate-800 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
