import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getCurrentUser } from '../api/client';
import { Film, CheckCircle2, AlertTriangle, Send, Plus, ArrowUpRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const user = getCurrentUser();
  const { data: shows, isLoading: loadingShows } = useQuery({ queryKey: ['shows'], queryFn: () => api.listShows() });
  const { data: validation, isLoading: loadingVal } = useQuery({ queryKey: ['validation-report'], queryFn: api.getValidationReport });
  const { data: history } = useQuery({ queryKey: ['publish-history'], queryFn: api.getPublishHistory });

  const totalShows = shows?.length || 0;
  const publishedShows = shows?.filter((s) => s.status === 'published').length || 0;
  const totalEpisodes = shows?.reduce((acc, s) => acc + (s.episode_count || 0), 0) || 0;
  const lastRun = history?.[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Welcome back, {user?.email}</h1>
        <p className="text-slate-400 text-sm mt-1">Here is the current operational status of the Peblo TV content pipeline.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Total Shows</span>
            <Film className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">{loadingShows ? '...' : totalShows}</div>
          <div className="text-xs text-slate-500 mt-1">{publishedShows} published · {totalShows - publishedShows} drafts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Total Episodes</span>
            <Film className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">{loadingShows ? '...' : totalEpisodes}</div>
          <div className="text-xs text-slate-500 mt-1">Across all seasons & shows</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Publish Readiness</span>
            {validation?.can_publish ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="text-2xl font-bold">
            {loadingVal ? (
              '...'
            ) : validation?.can_publish ? (
              <span className="text-emerald-400">Ready to Publish</span>
            ) : (
              <span className="text-amber-400">{validation?.total_issues} Issues Blocking</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {validation?.can_publish ? 'All published items validated' : 'Action required before publishing'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Last Publish</span>
            <Send className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-200">
            {lastRun ? (
              <span className={lastRun.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                {lastRun.status.toUpperCase()}
              </span>
            ) : (
              'Never'
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lastRun ? new Date(lastRun.started_at).toLocaleString() : 'No publish runs recorded'}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/shows"
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-brand-500/50 rounded-xl p-6 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 group-hover:text-brand-300">Manage Shows & Episodes</h2>
          <p className="text-sm text-slate-400 mt-1">
            Edit metadata, manage trailer (Season 0) and episodic seasons, and upload 2:3 & 16:9 artworks.
          </p>
        </Link>

        <Link
          to="/validation"
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-6 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 group-hover:text-amber-300">Validation Report</h2>
          <p className="text-sm text-slate-400 mt-1">
            Review detailed human-readable errors preventing catalogue publication and jump to fix them.
          </p>
        </Link>

        <Link
          to="/publish"
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300">Publish Pipeline</h2>
          <p className="text-sm text-slate-400 mt-1">
            Run atomic catalogue generation, collapse language variants, and monitor publication history.
          </p>
        </Link>
      </div>
    </div>
  );
};
