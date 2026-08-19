import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { viewerApi, getMediaUrl } from '../api/client';
import { CatalogueEpisode, CatalogueShow } from '../types';
import {
  ArrowLeft,
  Play,
  Plus,
  Check,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Film,
  Star,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return '22m';
  const m = Math.floor(seconds / 60);
  return `${m}m`;
};

const getEpisodeSynopsis = (showTitle: string, ep: CatalogueEpisode): string => {
  const t = ep.title.toLowerCase();
  if (t.includes('rajasthan')) {
    return 'Fifteen camel herds enter a royal desert arena where Moti must learn ancient desert tracks, discovering bravery and festive folklore.';
  }
  if (t.includes('himachal')) {
    return 'A high-altitude mountain pass tests Moti’s courage across icy streams, apple orchards, and pine forests to help lost village travelers.';
  }
  if (t.includes('trailer') || t.includes('teaser')) {
    return 'Official teaser exploring the action-packed cultural journeys and colorful characters across India.';
  }
  if (t.includes('run hero run')) {
    return 'High-tempo lyrical musical track showcasing Moti running across the scenic Himachal hills.';
  }
  return `Moti and friends face exciting cultural adventures and learning challenges in Episode ${ep.episode_number}.`;
};

export const ShowDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isMyList, setIsMyList] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState<boolean>(false);

  const { data: catalogue, isLoading } = useQuery({
    queryKey: ['catalogue'],
    queryFn: viewerApi.getCatalogue,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const allShows = Object.values(catalogue?.sections || {}).flat();
  const show = allShows.find((s) => s.slug === slug);

  if (!show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-white">Show Not Found</h2>
        <Link to="/" className="text-sm text-red-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>
      </div>
    );
  }

  // Seasons list + Trailers option
  const seasonOptions = show.seasons.map((s) => ({
    number: s.season_number,
    label: `Season ${s.season_number} (${s.episodes.length} EP)`,
    episodes: s.episodes,
  }));

  if (show.trailers && show.trailers.length > 0) {
    seasonOptions.push({
      number: 0,
      label: `Trailers & Extras (${show.trailers.length} EP)`,
      episodes: show.trailers,
    });
  }

  const currentSeasonOption =
    seasonOptions.find((opt) => opt.number === selectedSeason) ||
    seasonOptions[0];

  const currentEpisodes = currentSeasonOption.episodes;
  const displayedEpisodes = showAllEpisodes
    ? currentEpisodes
    : currentEpisodes.slice(0, 10);

  const firstEpisode = currentEpisodes[0];
  const bannerUrl = getMediaUrl(show.artwork.banner);

  // Recommendations for "More Like This"
  const relatedShows = allShows
    .filter((s) => s.slug !== show.slug)
    .slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24 animate-in fade-in duration-200">
      {/* Netflix Quick-View Card Frame matching Reference Image */}
      <div className="bg-[#141414] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
        {/* Top Hero Media Backdrop */}
        <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[460px] bg-slate-950 flex items-end">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={show.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-slate-900 to-black" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent w-2/3" />

          {/* Close X Button top-right */}
          <Link
            to="/"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-transform hover:scale-105"
            title="Back to Home"
          >
            ✕
          </Link>

          {/* Banner Title & Action Buttons */}
          <div className="relative z-10 p-6 sm:p-8 space-y-4 w-full">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
              {show.title}
            </h1>

            <div className="flex items-center gap-3 pt-2">
              {firstEpisode && (
                <button
                  onClick={() => navigate(`/watch/${show.slug}/${firstEpisode.content_group}`)}
                  className="bg-white hover:bg-white/90 text-black font-extrabold py-2.5 px-7 rounded-lg flex items-center gap-2 shadow-xl transition-all hover:scale-105 text-sm"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play</span>
                </button>
              )}

              <button
                onClick={() => setIsMyList(!isMyList)}
                className="w-10 h-10 rounded-full border-2 border-white/40 hover:border-white text-white flex items-center justify-center bg-black/40 backdrop-blur transition-all hover:scale-105"
                title="My List"
              >
                {isMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsLiked(!isLiked)}
                className="w-10 h-10 rounded-full border-2 border-white/40 hover:border-white text-white flex items-center justify-center bg-black/40 backdrop-blur transition-all hover:scale-105"
                title="Rate"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Metadata Details Section (Exact Reference Layout) */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column (2/3 width): Badges & Synopsis */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                <span className="text-emerald-400 font-bold">98% match</span>
                <span className="text-slate-300">2024</span>
                <span className="text-slate-300">
                  {show.seasons.length} {show.seasons.length > 1 ? 'Seasons' : 'Season'}
                </span>
                <span className="border border-white/40 text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  HD
                </span>
                <span className="border border-white/40 text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  U/A 7+
                </span>
                <span className="text-slate-400 text-[11px]">Adventure, Culture, Animals</span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {show.synopsis ||
                  'Follow Moti the adventurous dog as he is reborn across India, making loyal friends in every state and exploring majestic lands from Rajasthan to Himachal Pradesh.'}
              </p>

              {/* Language Tag */}
              <div className="pt-2">
                <span className="text-xs font-bold text-white border-b-2 border-red-600 pb-1">
                  Hindi [Original], English
                </span>
              </div>
            </div>

            {/* Right Column (1/3 width): Cast, Genres, Tags */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Cast: </span>
                <span className="text-slate-200">Moti, Banyan Dadi, Royal Camels, Valley Friends</span>
              </div>
              <div>
                <span className="text-slate-400">Genres: </span>
                <span className="text-slate-200 capitalize">
                  {show.categories?.join(', ') || 'Kids & Family, Animated Series, Cultural Tales'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">This show is: </span>
                <span className="text-slate-200">Heartwarming, Inspiring, Educational, Adventurous</span>
              </div>
            </div>
          </div>

          {/* Episodes Header with Netflix Season Dropdown */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Episodes</h2>

              {/* Netflix-Style Season Dropdown Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-[#242424] hover:bg-[#333] border border-white/20 text-white text-xs font-bold py-2 px-4 rounded-md flex items-center gap-2 shadow transition-colors"
                >
                  <span>{currentSeasonOption.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-[#242424] border border-white/20 rounded-md shadow-2xl z-30 py-1 divide-y divide-white/5">
                    {seasonOptions.map((opt) => (
                      <button
                        key={opt.number}
                        onClick={() => {
                          setSelectedSeason(opt.number);
                          setIsDropdownOpen(false);
                          setShowAllEpisodes(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-white/10 transition-colors ${
                          selectedSeason === opt.number
                            ? 'text-white bg-white/5 font-black'
                            : 'text-slate-300'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedSeason === opt.number && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Episodes List View (Exact Reference Image numbered list layout) */}
            <div className="divide-y divide-white/10">
              {displayedEpisodes.map((ep: CatalogueEpisode, index: number) => {
                const thumbUrl = getMediaUrl(ep.artwork.thumbnail);
                return (
                  <div
                    key={ep.content_group}
                    onClick={() => navigate(`/watch/${show.slug}/${ep.content_group}`)}
                    className="py-4 px-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group flex items-start gap-4"
                  >
                    {/* Large Episode Number */}
                    <span className="text-xl font-bold text-slate-400 group-hover:text-white w-6 text-center pt-2 flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* 16:9 Thumbnail with Hover Play */}
                    <div className="w-32 sm:w-36 aspect-video bg-slate-900 rounded-lg overflow-hidden relative flex-shrink-0 border border-white/10">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950">
                          <Film className="w-6 h-6 text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Episode Title, Duration & Rich Synopsis */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                          Ep. {ep.episode_number} – {ep.title}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium flex-shrink-0">
                          {formatDuration(ep.duration_seconds)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {getEpisodeSynopsis(show.title, ep)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand / Show More Toggle */}
            {currentEpisodes.length > 10 && (
              <div className="pt-2 text-center border-t border-white/10">
                <button
                  onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                  className="w-8 h-8 rounded-full border border-white/20 hover:border-white bg-[#242424] text-white inline-flex items-center justify-center transition-transform hover:scale-110"
                  title={showAllEpisodes ? 'Show Less' : 'Show More Episodes'}
                >
                  {showAllEpisodes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Section: More Like This (Exact 3-column reference grid) */}
          <div className="pt-8 border-t border-white/10 space-y-4">
            <h2 className="text-xl font-bold text-white">More Like This</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedShows.map((rel: CatalogueShow) => {
                const poster = getMediaUrl(rel.artwork.poster);
                return (
                  <Link
                    key={rel.show_id}
                    to={`/show/${rel.slug}`}
                    className="bg-[#242424] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all flex flex-col group"
                  >
                    <div className="w-full aspect-[16/9] bg-slate-900 relative overflow-hidden">
                      {poster ? (
                        <img
                          src={poster}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-xs text-slate-500 font-bold">
                          {rel.title}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur text-[10px] font-bold text-slate-200 px-2 py-0.5 rounded">
                        {rel.seasons?.length || 1} {rel.seasons?.length > 1 ? 'Seasons' : 'Season'}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-bold text-xs">84% match</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                            className="w-7 h-7 rounded-full border border-white/40 hover:border-white text-white flex items-center justify-center bg-black/40 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                          <span className="border border-white/30 px-1 rounded text-[9px]">U/A 7+</span>
                          <span>2024</span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-red-400 truncate">
                          {rel.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                          {rel.synopsis || 'Exciting episodes and cultural tales on Peblo TV.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
