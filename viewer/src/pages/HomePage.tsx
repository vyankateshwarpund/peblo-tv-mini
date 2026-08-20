import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { viewerApi, getMediaUrl } from '../api/client';
import { CatalogueShow, CatalogueEpisode } from '../types';
import { Play, Info, AlertCircle, Film, Sparkles, ChevronRight, ChevronLeft, Star, Plus, Check } from 'lucide-react';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

const ShowPosterCard: React.FC<{ show: CatalogueShow }> = ({ show }) => {
  const [isHovered, setIsHovered] = useState(false);
  const posterUrl = getMediaUrl(show.artwork.poster);
  const bannerUrl = getMediaUrl(show.artwork.banner);

  const totalEpisodes =
    (show.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0) +
    (show.trailers?.length || 0);

  return (
    <Link
      to={`/show/${show.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-shrink-0 w-44 sm:w-56 md:w-64 group cursor-pointer transition-all duration-300 hover:scale-105"
    >
      <div className="w-full aspect-[16/9] bg-slate-900 rounded-xl overflow-hidden shadow-lg relative border border-white/10 group-hover:border-red-600 transition-colors">
        {bannerUrl || posterUrl ? (
          <img
            src={bannerUrl || posterUrl}
            alt={show.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950">
            <Film className="w-8 h-8 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-300 line-clamp-2">{show.title}</span>
          </div>
        )}

        {/* Hover Action Overlay (Netflix Style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black shadow">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
            <span className="text-xs font-black text-white truncate">{show.title}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
            <span className="text-emerald-400 font-bold">98% match</span>
            <span className="border border-white/30 px-1 rounded text-[9px]">U/A 7+</span>
            <span>{totalEpisodes} Episodes</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 capitalize">
            {show.categories?.slice(0, 2).join(' • ')}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-200 truncate group-hover:text-red-400 transition-colors">
          {show.title}
        </h3>
        <span className="text-[10px] text-slate-500 font-medium capitalize">
          {show.section}
        </span>
      </div>
    </Link>
  );
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [playingShow, setPlayingShow] = useState<{ show: CatalogueShow; episode: CatalogueEpisode } | null>(null);

  const { data: catalogue, isLoading, error, refetch } = useQuery({
    queryKey: ['catalogue'],
    queryFn: viewerApi.getCatalogue,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <p className="text-sm">Loading Peblo TV...</p>
      </div>
    );
  }

  if (error || !catalogue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-800 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Catalogue Not Available</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          {(error as any)?.message || 'Please publish catalogue from CMS.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const allShows = Object.values(catalogue.sections).flat();
  const featuredShows = catalogue.sections['featured'] || [];
  const heroShow = featuredShows.length > 0 ? featuredShows[0] : allShows[0];

  const sectionOrder = ['featured', 'series', 'songs', 'minisodes'];
  const sections = Object.keys(catalogue.sections).sort((a, b) => {
    const idxA = sectionOrder.indexOf(a);
    const idxB = sectionOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const sectionTitles: Record<string, string> = {
    featured: 'Featured on Peblo TV',
    series: 'Original Animated Series',
    songs: 'Peblo Songs & Lyrical Tracks',
    minisodes: 'Discover India & Learning Minisodes',
  };

  const heroBannerUrl = getMediaUrl(heroShow?.artwork.banner);
  const heroFirstEp = heroShow?.seasons?.[0]?.episodes?.[0] || heroShow?.trailers?.[0];

  return (
    <div className="space-y-10 pb-24">
      {/* Netflix Hero Banner */}
      {heroShow && (
        <div className="relative h-[70vh] min-h-[460px] max-h-[660px] w-full flex items-end">
          {heroBannerUrl ? (
            <img
              src={heroBannerUrl}
              alt={heroShow.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-slate-900 to-black" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/70 to-transparent w-full md:w-3/4" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 w-full space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider shadow">
                Featured
              </span>
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-white/10">
                <Star className="w-3.5 h-3.5 fill-emerald-400" /> 98% Match
              </span>
              <span className="bg-black/60 backdrop-blur text-slate-300 text-xs font-medium px-2 py-0.5 rounded border border-white/10">
                2024
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg max-w-2xl">
              {heroShow.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl line-clamp-3 leading-relaxed drop-shadow">
              {heroShow.synopsis || 'Explore episodes and original seasons on Peblo TV.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              {heroFirstEp && (
                <button
                  onClick={() => navigate(`/watch/${heroShow.slug}/${heroFirstEp.content_group}`)}
                  className="bg-white hover:bg-white/90 text-black font-extrabold py-3 px-8 rounded-xl flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 text-sm"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Play</span>
                </button>
              )}
              <Link
                to={`/show/${heroShow.slug}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold py-3 px-7 rounded-xl flex items-center gap-2 transition-colors text-sm border border-white/10"
              >
                <Info className="w-4 h-4" />
                <span>More Info</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Netflix Horizontal Show Carousels by Category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {sections.map((sectionKey) => {
          const shows = catalogue.sections[sectionKey];
          if (!shows || shows.length === 0) return null;

          return (
            <div key={sectionKey} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{sectionTitles[sectionKey] || `${sectionKey.toUpperCase()} SHOWS`}</span>
                </h2>
                <Link
                  to={`/search?section=${sectionKey}`}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <span>Explore All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Horizontal Scroll Row */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {shows.map((show) => (
                  <ShowPosterCard key={show.show_id} show={show} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Player Modal */}
      {playingShow && (
        <VideoPlayerModal
          isOpen={Boolean(playingShow)}
          onClose={() => setPlayingShow(null)}
          show={playingShow.show}
          initialEpisode={playingShow.episode}
        />
      )}
    </div>
  );
};
