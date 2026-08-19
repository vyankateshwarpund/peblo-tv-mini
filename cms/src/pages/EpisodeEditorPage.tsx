import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArtworkUploader } from '../components/ArtworkUploader';
import { ArrowLeft, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const EpisodeEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const episodeId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: episode, isLoading, error } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => api.getEpisode(episodeId),
    enabled: !!episodeId,
  });

  const [title, setTitle] = useState('');
  const [number, setNumber] = useState(1);
  const [duration, setDuration] = useState<number | ''>('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [contentGroup, setContentGroup] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (episode) {
      setTitle(episode.episode_title);
      setNumber(episode.episode_number);
      setDuration(episode.duration_seconds ?? '');
      setLanguage(episode.language);
      setContentGroup(episode.content_group);
      setStatus(episode.status);
    }
  }, [episode]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateEpisode(episodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode', episodeId] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.data?.detail?.message || err.message || 'Save failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEpisode(episodeId),
    onSuccess: () => navigate(-1),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    updateMutation.mutate({
      episode_title: title,
      episode_number: number,
      duration_seconds: duration === '' ? null : Number(duration),
      language,
      content_group: contentGroup,
      status,
    });
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400">Loading episode...</div>;
  if (error || !episode) return <div className="p-12 text-center text-rose-400">Episode not found</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Show</span>
        </button>

        <button
          onClick={() => {
            if (confirm('Delete this episode?')) deleteMutation.mutate();
          }}
          className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs px-3 py-1.5 rounded-lg border border-rose-900 bg-rose-950/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Episode</span>
        </button>
      </div>

      {/* Episode Details Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Episode Editor</h1>

        {saveError && (
          <div className="mb-4 p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Episode metadata saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Episode Number</label>
              <input
                type="number"
                min="0"
                required
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Episode Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Seconds)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 420"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Content Group Identifier
            </label>
            <input
              type="text"
              required
              value={contentGroup}
              onChange={(e) => setContentGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Episodes sharing this key collapse into ONE catalogue entry listing both languages.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2 px-5 rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Labelled Artwork Upload Slots */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Artwork Assets</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Three labelled upload slots. Must be max 200 KB with correct aspect ratios before publishing.
          </p>
        </div>

        <ArtworkUploader
          episodeId={episodeId}
          artworks={episode.artworks || []}
          onArtworkUpdated={() => queryClient.invalidateQueries({ queryKey: ['episode', episodeId] })}
        />
      </div>
    </div>
  );
};
