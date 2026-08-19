import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, ArrowLeft, Trash2, Edit2, Film, CheckCircle, Clock } from 'lucide-react';

export const ShowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const showId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: show, isLoading, error } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => api.getShow(showId),
    enabled: !!showId,
  });

  const { data: refConfig } = useQuery({ queryKey: ['reference'], queryFn: api.getReference });

  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isAddEpisodeOpen, setIsAddEpisodeOpen] = useState(false);
  const [newSeasonNum, setNewSeasonNum] = useState(1);

  // New Episode Form State
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  const [epDuration, setEpDuration] = useState<number>(300);
  const [epLanguage, setEpLanguage] = useState<'en' | 'hi'>('en');
  const [epContentGroup, setEpContentGroup] = useState('');
  const [epStatus, setEpStatus] = useState<'draft' | 'published'>('draft');
  const [epError, setEpError] = useState<string | null>(null);

  const activeSeason = show?.seasons?.find((s) => s.id === (activeSeasonId || show?.seasons?.[0]?.id));

  const addSeasonMutation = useMutation({
    mutationFn: () => api.createSeason(showId, { season_number: newSeasonNum }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show', showId] });
      setIsAddSeasonOpen(false);
    },
  });

  const addEpisodeMutation = useMutation({
    mutationFn: (data: any) => api.createEpisode(activeSeason!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show', showId] });
      setIsAddEpisodeOpen(false);
      setEpTitle('');
      setEpContentGroup('');
    },
    onError: (err: any) => {
      setEpError(err.data?.detail?.message || err.message || 'Failed to create episode');
    },
  });

  const deleteShowMutation = useMutation({
    mutationFn: () => api.deleteShow(showId),
    onSuccess: () => navigate('/shows'),
  });

  const handleAddEpisodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEpError(null);
    addEpisodeMutation.mutate({
      episode_number: epNumber,
      episode_title: epTitle,
      duration_seconds: epDuration,
      language: epLanguage,
      content_group: epContentGroup || `${show?.slug}-s${String(activeSeason?.season_number).padStart(2, '0')}e${String(epNumber).padStart(2, '0')}`,
      status: epStatus,
    });
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400">Loading show details...</div>;
  if (error || !show) return <div className="p-12 text-center text-rose-400">Show not found</div>;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link to="/shows" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shows</span>
        </Link>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete '${show.title}' and all its episodes?`)) {
              deleteShowMutation.mutate();
            }
          }}
          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs px-3 py-1.5 rounded-lg border border-rose-900 bg-rose-950/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Show</span>
        </button>
      </div>

      {/* Show Metadata Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                  show.status === 'published'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {show.status}
              </span>
              <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
                Section: {show.section || 'None (Draft)'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">{show.title}</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">slug: {show.slug}</p>
            <p className="text-sm text-slate-300 mt-3 max-w-3xl">{show.synopsis || 'No synopsis provided.'}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {show.categories?.map((c) => (
                <span key={c} className="text-xs bg-slate-950 text-slate-400 px-2.5 py-0.5 rounded border border-slate-800">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons & Episodes Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {show.seasons?.map((season) => {
              const isSelected = activeSeason?.id === season.id;
              return (
                <button
                  key={season.id}
                  onClick={() => setActiveSeasonId(season.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{season.season_number === 0 ? 'Season 0 (Trailers)' : `Season ${season.season_number}`}</span>
                  <span className="text-xs opacity-75 bg-black/30 px-1.5 py-0.5 rounded">
                    {season.episodes?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAddSeasonOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-950/60 border border-brand-800 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Season</span>
          </button>
        </div>

        {/* Active Season Episodes */}
        {activeSeason ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200">
                {activeSeason.season_number === 0 ? 'Trailers & Extras (Season 0)' : `Season ${activeSeason.season_number} Episodes`}
              </h2>
              <button
                onClick={() => {
                  setEpNumber((activeSeason.episodes?.length || 0) + 1);
                  setIsAddEpisodeOpen(true);
                }}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Episode</span>
              </button>
            </div>

            {activeSeason.episodes?.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm">
                No episodes in this season yet. Click "Add Episode" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Language</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Content Group</th>
                      <th className="px-4 py-3">Artwork</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeSeason.episodes?.map((ep) => {
                      const hasPoster = ep.artworks?.some((a) => a.artwork_type === 'poster');
                      const hasBanner = ep.artworks?.some((a) => a.artwork_type === 'banner');
                      const hasThumb = ep.artworks?.some((a) => a.artwork_type === 'thumbnail');
                      const artCount = (hasPoster ? 1 : 0) + (hasBanner ? 1 : 0) + (hasThumb ? 1 : 0);

                      return (
                        <tr key={ep.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">{ep.episode_number}</td>
                          <td className="px-4 py-3 font-medium text-slate-100">{ep.episode_title}</td>
                          <td className="px-4 py-3">
                            <span className="uppercase text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ep.language}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                            {ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m ${ep.duration_seconds % 60}s` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs max-w-xs truncate">
                            {ep.content_group}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                artCount === 3
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {artCount}/3 artworks
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                                ep.status === 'published' ? 'text-emerald-400 bg-emerald-950' : 'text-slate-400 bg-slate-800'
                              }`}
                            >
                              {ep.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/episodes/${ep.id}`}
                              className="text-brand-400 hover:text-brand-300 text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors inline-block"
                            >
                              Edit / Artwork
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">No seasons available. Add one above.</div>
        )}
      </div>

      {/* Add Season Modal */}
      {isAddSeasonOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Add Season</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Season Number</label>
                <input
                  type="number"
                  min="0"
                  value={newSeasonNum}
                  onChange={(e) => setNewSeasonNum(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">Note: Season 0 is reserved for Trailers.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsAddSeasonOpen(false)} className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded">
                  Cancel
                </button>
                <button
                  onClick={() => addSeasonMutation.mutate()}
                  className="px-4 py-1.5 bg-brand-600 text-xs font-semibold text-white rounded"
                >
                  Create Season
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Episode Modal */}
      {isAddEpisodeOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4">
              Add Episode to {activeSeason?.season_number === 0 ? 'Trailers' : `Season ${activeSeason?.season_number}`}
            </h2>

            {epError && (
              <div className="mb-4 p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded">
                {epError}
              </div>
            )}

            <form onSubmit={handleAddEpisodeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Episode Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={epNumber}
                    onChange={(e) => setEpNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Language</label>
                  <select
                    value={epLanguage}
                    onChange={(e) => setEpLanguage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Episode Title</label>
                <input
                  type="text"
                  required
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  placeholder="e.g. The Lost Kite"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    value={epDuration}
                    onChange={(e) => setEpDuration(Number(e.target.value))}
                    placeholder="300"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={epStatus}
                    onChange={(e) => setEpStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Content Group (Shared across EN/HI variants)
                </label>
                <input
                  type="text"
                  value={epContentGroup}
                  onChange={(e) => setEpContentGroup(e.target.value)}
                  placeholder="e.g. motis-many-lives-s01e01"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEpisodeOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEpisodeMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-xs font-semibold text-white rounded"
                >
                  {addEpisodeMutation.isPending ? 'Creating...' : 'Create Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
