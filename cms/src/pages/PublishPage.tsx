import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getCurrentUser } from '../api/client';
import { Send, CheckCircle2, AlertTriangle, Shield, Clock, History, AlertCircle } from 'lucide-react';

export const PublishPage: React.FC = () => {
  const user = getCurrentUser();
  const queryClient = useQueryClient();
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['validation-report'],
    queryFn: api.getValidationReport,
  });

  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ['publish-history'],
    queryFn: api.getPublishHistory,
  });

  const publishMutation = useMutation({
    mutationFn: api.publishCatalogue,
    onSuccess: (data) => {
      setPublishResult(data);
      setPublishError(null);
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
    },
    onError: (err: any) => {
      setPublishError(err.data?.detail?.message || err.message || 'Publishing failed');
    },
  });

  const isAdmin = user?.role === 'admin';
  const isBlocked = !report?.can_publish;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Atomic Catalogue Publishing</h1>
        <p className="text-slate-400 text-sm mt-1">
          Builds deterministic catalogue.json in temp storage and atomically replaces the live file.
        </p>
      </div>

      {/* Publish Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Publish to Live Surface</h2>
              <p className="text-xs text-slate-400">Restricted to Admin role · Enforces full validation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                report?.can_publish
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {report?.can_publish ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{report?.can_publish ? 'Validation Passed' : `${report?.total_issues} Blockers`}</span>
            </span>
          </div>
        </div>

        {/* Status / Alert Messages */}
        {publishError && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Publish Failed:</span>
              <p className="text-xs mt-1 text-rose-200">{publishError}</p>
            </div>
          </div>
        )}

        {publishResult && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <span className="font-bold text-emerald-200">Catalogue Published Successfully!</span>
              <p className="text-xs mt-1 text-emerald-300">
                Published {publishResult.published_show_count} shows and {publishResult.published_episode_count} episodes.
                The live viewer surface is now serving the new catalogue.json atomically.
              </p>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>You are logged in as an <strong>Editor</strong>. Publishing is restricted to <strong>Admin</strong> users.</span>
          </div>
        )}

        {isBlocked && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl">
            <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Publication Blocked — {report?.total_issues} issues need attention:</span>
            </h3>
            <ul className="text-xs text-amber-200/90 space-y-1.5 list-disc list-inside">
              {report?.errors?.slice(0, 5).map((e, idx) => (
                <li key={idx}>
                  <strong className="text-amber-100">{e.entity_title || e.entity_type}</strong>: {e.message}
                </li>
              ))}
              {(report?.errors?.length || 0) > 5 && (
                <li className="text-amber-400 font-semibold">
                  ...plus {(report?.errors?.length || 0) - 5} more issues. Check Validation Report.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => publishMutation.mutate()}
            disabled={!isAdmin || isBlocked || publishMutation.isPending}
            className="bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <Send className="w-4 h-4" />
            <span>{publishMutation.isPending ? 'Publishing Catalogue...' : 'Publish Catalogue'}</span>
          </button>
        </div>
      </div>

      {/* Publish Run History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-100">Publish Run History</h2>
        </div>

        {loadingRuns ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading publish history...</div>
        ) : runs?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No publication runs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase text-slate-400 bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Triggered By</th>
                  <th className="px-4 py-2.5">Started At</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Shows</th>
                  <th className="px-4 py-2.5">Episodes</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {runs?.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400">#{run.id}</td>
                    <td className="px-4 py-3 text-slate-200">{run.triggered_by}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(run.started_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          run.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{run.published_show_count}</td>
                    <td className="px-4 py-3 text-slate-300">{run.published_episode_count}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate font-sans">
                      {run.error_message || 'OK'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
