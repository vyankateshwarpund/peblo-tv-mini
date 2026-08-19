import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { viewerApi, getMediaUrl } from '../api/client';
import { CatalogueShow, CatalogueEpisode } from '../types';
import {
  ArrowLeft,
  Globe,
  Clock,
  Sparkles,
  Youtube,
  Play,
  Check,
  Plus,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  List,
  Film
} from 'lucide-react';

const resolveYouTubeId = (showTitle: string, episode: CatalogueEpisode): string => {
  const epTitle = (episode.title || '').toLowerCase();
  const show = (showTitle || '').toLowerCase();
  const cg = (episode.content_group || '').toLowerCase();

  if (cg.includes('trailer-official') || (epTitle.includes('trailer') && epTitle.includes('rajasthan'))) {
    return 'uLLJ9vYAeWw';
  }
  if (cg.includes('teaser-1') && epTitle.includes('rajasthan')) {
    return 'cwV2ycLSaY8';
  }
  if (cg.includes('teaser-2') || epTitle.includes('teaser 2')) {
    return 'dGSliL4IrCg';
  }
  if (cg.includes('himachal-teaser') || (epTitle.includes('himachal') && epTitle.includes('teaser'))) {
    return 'JJEXvK6nDRM';
  }
  if (epTitle.includes('run hero run') || (show.includes('lyrical') && epTitle.includes('run'))) {
    return 'ZDlcI80eAp0';
  }
  if (epTitle.includes('rajasthan') || episode.episode_number === 1) {
    return '1p7HEhdzVf4';
  }
  if (epTitle.includes('himachal') || episode.episode_number === 2) {
    return 'xzZXcwVwz3s';
  }
  if (show.includes('song') || epTitle.includes('song') || epTitle.includes('rhyme')) {
    return '9JfeF9ZDZtI';
  }

  return '1p7HEhdzVf4';
};

const getEpisodeDescription = (showTitle: string, episode: CatalogueEpisode): string => {
  const t = (episode.title || '').toLowerCase();
  if (t.includes('rajasthan')) {
    return 'Moti arrives in the vibrant desert landscapes of Rajasthan! Meeting camel herds, royal forts, and festive folk dancers, Moti embarks on an unforgettable journey of friendship and courage.';
  }
  if (t.includes('himachal')) {
    return 'Moti journeys into the majestic snow-capped peaks of Himachal Pradesh, navigating pine forests, apple orchards, and mountain streams while helping local village friends.';
  }
  if (t.includes('trailer') || t.includes('teaser')) {
    return 'Catch a thrilling sneak peek of Moti’s epic travels across India with exclusive behind-the-scenes previews and teaser clips.';
  }
  if (t.includes('run hero run')) {
    return 'Sing along to the high-energy lyrical soundtrack featuring Moti’s daring alpine chase across the Himachal hills.';
  }
  return `Join Moti and friends in Episode ${episode.episode_number} for an exciting story filled with curiosity, learning, and cultural wonder.`;
};

export const WatchPage: React.FC = () => {
  const { slug, contentGroup } = useParams<{ slug: string; contentGroup?: string }>();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isMyList, setIsMyList] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState<boolean>(true);

  const { data: catalogue, isLoading } = useQuery({
    queryKey: ['catalogue'],
    queryFn: viewerApi.getCatalogue,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const allShows = Object.values(catalogue?.sections || {}).flat();
  const show = allShows.find((s) => s.slug === slug);

  if (!show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-slate-400 gap-4">
        <h2 className="text-xl font-bold text-white">Show Not Found</h2>
        <Link to="/" className="text-sm text-red-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>
      </div>
    );
  }

  const allEpisodes = show.seasons.flatMap((s) => s.episodes);
  const allTrailers = show.trailers || [];
  const combinedPlaylist = [...allEpisodes, ...allTrailers];

  const currentEpisode =
    combinedPlaylist.find((e) => e.content_group === contentGroup) ||
    combinedPlaylist[0];

  const currentIndex = combinedPlaylist.findIndex((e) => e.content_group === currentEpisode?.content_group);
  const prevEpisode = currentIndex > 0 ? combinedPlaylist[currentIndex - 1] : null;
  const nextEpisode = currentIndex < combinedPlaylist.length - 1 ? combinedPlaylist[currentIndex + 1] : null;

  const youtubeId = currentEpisode ? resolveYouTubeId(show.title, currentEpisode) : '1p7HEhdzVf4';
  const youtubeUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;

  const availableLanguages = currentEpisode?.languages || ['en'];

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      {/* Theater Top Navigation Bar */}
      <header className="bg-black/90 backdrop-blur border-b border-slate-900 px-4 py-3 sm:px-6 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-4">
          <Link
            to={`/show/${show.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Show Overview</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                Peblo Theater
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-slate-300">{show.title}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-sm sm:max-w-md">
              {currentEpisode ? `EP ${currentEpisode.episode_number}: ${currentEpisode.title}` : 'Now Playing'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlaylistSidebar(!showPlaylistSidebar)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 text-xs font-medium"
          >
            <List className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Episodes ({combinedPlaylist.length})</span>
          </button>
        </div>
      </header>

      {/* Main Theater Player & Side Playlist Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center Video Stage */}
        <div className="flex-1 flex flex-col bg-black overflow-y-auto">
          {/* Main Video Frame */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center max-h-[70vh]">
            <iframe
              key={youtubeUrl}
              src={youtubeUrl}
              title={`${show.title} - ${currentEpisode?.title}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Details & Controls below video */}
          <div className="p-4 sm:p-8 space-y-6 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-900">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-emerald-400 font-bold text-xs">98% Match</span>
                  <span className="text-slate-400 text-xs font-semibold">2024</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    U/A 7+
                  </span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Full HD 1080p
                  </span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    5.1 Audio
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white">
                  {currentEpisode ? `EP ${currentEpisode.episode_number}: ${currentEpisode.title}` : ''}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentEpisode ? getEpisodeDescription(show.title, currentEpisode) : ''}
                </p>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {prevEpisode && (
                  <button
                    onClick={() => navigate(`/watch/${show.slug}/${prevEpisode.content_group}`)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}

                {nextEpisode && (
                  <button
                    onClick={() => navigate(`/watch/${show.slug}/${nextEpisode.content_group}`)}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  >
                    <span>Next Episode</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setIsMyList(!isMyList)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isMyList
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {isMyList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isLiked
                      ? 'bg-red-950/80 border-red-700 text-red-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Selector */}
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-900 p-4 rounded-2xl">
              <Globe className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-slate-300">Audio Language:</span>
              <div className="flex items-center gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors capitalize ${
                      selectedLanguage === lang
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    {lang === 'en' ? 'English [Original]' : lang === 'hi' ? 'Hindi [Audio]' : lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Playlist (Netflix Theater Mode) */}
        {showPlaylistSidebar && (
          <aside className="w-full lg:w-96 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-900 flex flex-col max-h-[85vh] lg:max-h-none overflow-y-auto">
            <div className="p-4 border-b border-slate-900 sticky top-0 bg-slate-950/95 backdrop-blur z-10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Episodes & Trailers
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {combinedPlaylist.length} Total
              </span>
            </div>

            <div className="divide-y divide-slate-900 p-2 space-y-1">
              {combinedPlaylist.map((ep, idx) => {
                const isSelected = ep.content_group === currentEpisode?.content_group;
                const thumb = getMediaUrl(ep.artwork.thumbnail);
                const isTrailer = ep.content_group?.includes('teaser') || ep.content_group?.includes('trailer');

                return (
                  <div
                    key={`${ep.content_group}-${idx}`}
                    onClick={() => navigate(`/watch/${show.slug}/${ep.content_group}`)}
                    className={`p-3 rounded-xl flex gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-950/40 border border-red-600/80 shadow-md shadow-red-600/20'
                        : 'hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="w-24 aspect-video bg-slate-900 rounded-lg overflow-hidden relative flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt={ep.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <Film className="w-5 h-5 text-slate-700" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className={`text-[10px] font-extrabold uppercase ${isTrailer ? 'text-amber-400' : 'text-slate-400'}`}>
                        {isTrailer ? 'Trailer' : `EP ${ep.episode_number}`}
                      </span>
                      <h4 className={`text-xs font-bold truncate mt-0.5 ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                        {ep.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)} mins` : '10 mins'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
