import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Show } from '../types';
import { Plus, Search, Filter, Film, ArrowRight, X } from 'lucide-react';

export const ShowsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Show Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [section, setSection] = useState('series');
  const [categoriesStr, setCategoriesStr] = useState('adventure, learning');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: refConfig } = useQuery({ queryKey: ['reference'], queryFn: api.getReference });
  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['shows', search, sectionFilter, statusFilter],
    queryFn: () => api.listShows({ q: search, section: sectionFilter, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: api.createShow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      setIsModalOpen(false);
      setTitle('');
      setSlug('');
      setSynopsis('');
    },
    onError: (err: any) => {
      setFormError(err.data?.detail?.message || err.message || 'Failed to create show');
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cats = categoriesStr.split(',').map((c) => c.trim()).filter(Boolean);
    createMutation.mutate({
      title,
      slug,
      synopsis,
      section: section || null,
      categories: cats,
      status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Shows & Catalogues</h1>
          <p className="text-slate-400 text-sm mt-1">Manage series, minisodes, songs, and trailer episodes.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Show</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shows by title or slug..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Sections</option>
            {refConfig?.sections.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Shows List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading shows...</div>
      ) : error ? (
        <div className="p-8 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-center">
          Failed to load shows: {(error as any).message}
        </div>
      ) : shows?.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Film className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No shows found</h3>
          <p className="text-sm text-slate-500 mt-1">Try clearing filters or create a new show.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows?.map((show) => (
            <Link
              key={show.id}
              to={`/shows/${show.id}`}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      show.status === 'published'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {show.status}
                  </span>
                  <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
                    {show.section || 'No Section'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1">
                  {show.title}
                </h2>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[2rem]">
                  {show.synopsis || 'No synopsis provided.'}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {show.categories?.map((cat) => (
                    <span key={cat} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {show.season_count} Seasons · {show.episode_count} Episodes
                </span>
                <span className="flex items-center gap-1 text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Show Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100">Create New Show</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Moti's Many Lives"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="motis-many-lives"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">None (Draft Only)</option>
                    {refConfig?.sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Categories (comma separated)</label>
                <input
                  type="text"
                  value={categoriesStr}
                  onChange={(e) => setCategoriesStr(e.target.value)}
                  placeholder="adventure, india, friendship"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Brief synopsis..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
