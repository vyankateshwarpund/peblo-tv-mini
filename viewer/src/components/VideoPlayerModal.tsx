import React, { useState } from 'react';
import {
  X,
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
  Volume2,
  Film
} from 'lucide-react';
import { CatalogueEpisode, CatalogueShow } from '../types';
import { getMediaUrl } from '../api/client';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: CatalogueShow;
  initialEpisode?: CatalogueEpisode | null;
}

const EXACT_CG_MAP: Record<string, string> = {
  // Moti's Many Lives
  'moti-rajasthan-ep1': '1p7HEhdzVf4',
  'moti-himachal-ep2': 'xzZXcwVwz3s',
  'moti-rajasthan-trailer-official': 'uLLJ9vYAeWw',
  'moti-rajasthan-teaser-1': 'cwV2ycLSaY8',
  'moti-rajasthan-teaser-2': 'dGSliL4IrCg',
  'moti-rajasthan-origin-story': 'lSyFUGwaEOQ',
  'moti-himachal-teaser-1': 'JJEXvK6nDRM',
  'moti-haryana-teaser-1': 'roAM1GBCUQs',

  // Tiny Tales by Banyan Dadi
  'banyan-fox-and-swan': '2Fg4uuMtKj4',
  'banyan-sparrow-cousins': 'qk4ne7yJbh0',
  'banyan-otter-and-river': 'wBOYwcYs87g',
  'banyan-fox-swan-trailer': 'hJSzxhmqK1c',
  'banyan-fox-swan-teaser-1': 'Hv_orBJKDQ8',
  'banyan-fox-swan-teaser-2': 'TRA3bkGmVaA',
  'banyan-sparrow-teaser-1': 'qNUvpgQnJAc',
  'banyan-sparrow-teaser-2': 'moVh0xPfP2M',
  'banyan-otter-teaser-1': 'ANlitX9t5fs',

  // Discover India with Moti
  'india-puppet-story': 'DHPYLmJyWYY',
  'india-magic-of-mud': 'ZW-gcuu4enA',
  'india-rajasthan-doc': '86cvVz1M5pE',
  'india-gittu-blueberry': '7lOLLmfj6qg',
  'india-craft-corner': 'PMqBebA5LqM',

  // Peblo Songs & Lyrical Tracks
  'song-basera': '9JfeF9ZDZtI',
  'song-run-hero-run': 'ZDlcI80eAp0',
  'song-wherever-water-goes': 'qAxH_87WvGk',
  'song-birds-of-feather': 'hUK37R55IQY',
  'song-life-is-easy': '6jni0olg0Ag',
  'song-just-a-little-more': '9EOU9PB9ZLI',
  'song-peblo-universe': '92VONAtrNqI',
  'song-boom-ba-dum': 'XYOddFQQjno',
  'song-tiny-tales-intro': 'VEucmiTM1B8',
};

const resolveYouTubeId = (showTitle: string, episode: CatalogueEpisode): string => {
  const cg = episode.content_group || '';
  if (EXACT_CG_MAP[cg]) {
    return EXACT_CG_MAP[cg];
  }
  const epTitle = (episode.title || '').toLowerCase();
  for (const [key, vid] of Object.entries(EXACT_CG_MAP)) {
    if (epTitle.includes(key.replace(/-/g, ' '))) {
      return vid;
    }
  }
  if (epTitle.includes('rajasthan')) return '1p7HEhdzVf4';
  if (epTitle.includes('himachal')) return 'xzZXcwVwz3s';
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

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  show,
  initialEpisode,
}) => {
  const [currentEpisode, setCurrentEpisode] = useState<CatalogueEpisode | null>(initialEpisode || null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isMyList, setIsMyList] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialEpisode) {
      setCurrentEpisode(initialEpisode);
    }
  }, [initialEpisode]);

  if (!isOpen || !currentEpisode) return null;

  // Flatten all episodes & trailers for up-next navigation
  const allSeasonEpisodes = show.seasons.flatMap((s) => s.episodes);
  const allTrailers = show.trailers || [];
  const combinedPlaylist = [...allSeasonEpisodes, ...allTrailers];

  const currentIndex = combinedPlaylist.findIndex((e) => e.content_group === currentEpisode.content_group);
  const prevEpisode = currentIndex > 0 ? combinedPlaylist[currentIndex - 1] : null;
  const nextEpisode = currentIndex < combinedPlaylist.length - 1 ? combinedPlaylist[currentIndex + 1] : null;

  const availableLanguages = currentEpisode.languages || ['en'];
  const youtubeId = resolveYouTubeId(show.title, currentEpisode);
  const youtubeUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  const isTrailer = currentEpisode.content_group?.includes('teaser') || currentEpisode.content_group?.includes('trailer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-850 bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-red-500 font-black text-sm tracking-wider uppercase flex items-center gap-1.5">
              <Youtube className="w-4 h-4 fill-red-500" />
              <span>Peblo Cinema</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px] sm:max-w-md">
              {show.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Frame */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center flex-shrink-0">
          <iframe
            key={youtubeUrl}
            src={youtubeUrl}
            title={`${show.title} - ${currentEpisode.title}`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Scrollable Details & Related Playlist Section */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900/90">
          {/* Episode Info & Action Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-850">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-emerald-400 font-bold text-xs">98% Match</span>
                <span className="text-slate-400 text-xs font-semibold">2024</span>
                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  U/A 7+
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  HD
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  5.1 Audio
                </span>
                {isTrailer && (
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    Trailer
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isTrailer ? currentEpisode.title : `EP ${currentEpisode.episode_number}: ${currentEpisode.title}`}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {getEpisodeDescription(show.title, currentEpisode)}
              </p>
            </div>

            {/* Actions: Prev / Next / My List / Like */}
            <div className="flex items-center gap-2 flex-shrink-0 self-start">
              {prevEpisode && (
                <button
                  onClick={() => setCurrentEpisode(prevEpisode)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1 text-xs font-semibold transition-colors"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
              )}

              {nextEpisode && (
                <button
                  onClick={() => setCurrentEpisode(nextEpisode)}
                  className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1 text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  title="Next Episode"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsMyList(!isMyList)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isMyList
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="My List"
              >
                {isMyList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isLiked
                    ? 'bg-red-950/60 border-red-700 text-red-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Like"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audio & Subtitle Language Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-slate-300">Audio Language:</span>
              <div className="flex items-center gap-1.5 ml-1">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors capitalize ${
                      selectedLanguage === lang
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'English (Audio)' : lang === 'hi' ? 'Hindi (Audio)' : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentEpisode.duration_seconds ? `${Math.floor(currentEpisode.duration_seconds / 60)} mins` : '10 mins'}</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1080p Ultra HD</span>
              </span>
            </div>
          </div>

          {/* Related / Up Next Episodes Playlist (Netflix Style) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>More Episodes & Clips in this Series</span>
              <span className="text-xs text-slate-500 font-normal">({combinedPlaylist.length} total)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {combinedPlaylist.map((ep, idx) => {
                const isSelected = ep.content_group === currentEpisode.content_group;
                const thumb = getMediaUrl(ep.artwork.thumbnail);
                const isEpTrailer = ep.content_group?.includes('teaser') || ep.content_group?.includes('trailer');

                return (
                  <div
                    key={`${ep.content_group}-${idx}`}
                    onClick={() => setCurrentEpisode(ep)}
                    className={`p-2.5 rounded-xl border flex gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-950/40 border-red-600 shadow-md shadow-red-600/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="w-24 aspect-video bg-slate-950 rounded-lg overflow-hidden relative flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt={ep.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <Film className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      {isSelected ? (
                        <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-extrabold uppercase ${isEpTrailer ? 'text-amber-400' : 'text-slate-400'}`}>
                          {isEpTrailer ? 'Trailer' : `EP ${ep.episode_number}`}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold truncate mt-0.5 ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                        {ep.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m` : '10m'} • {ep.languages?.join(', ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
