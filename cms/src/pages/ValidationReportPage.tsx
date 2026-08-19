import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Film, Image as ImageIcon } from 'lucide-react';

export const ValidationReportPage: React.FC = () => {
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['validation-report'],
    queryFn: api.getValidationReport,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Publication Validation Report</h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralized validation engine checking sections, artwork specifications, and durations.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
        >
          Refresh Report
        </button>
      </div>

      {/* Readiness Banner */}
      <div
        className={`border rounded-2xl p-6 flex items-center justify-between ${
          report?.can_publish
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-amber-950/40 border-amber-800 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-4">
          {report?.can_publish ? (
            <ShieldCheck className="w-10 h-10 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-amber-400 flex-shrink-0" />
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {isLoading
                ? 'Validating catalogue...'
                : report?.can_publish
                ? 'Catalogue Ready for Atomic Publication'
                : `Publish Blocked: ${report?.total_issues} Issues Require Attention`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {report?.can_publish
                ? 'All published shows and episodes satisfy section, artwork, and duration requirements.'
                : 'All listed errors must be resolved before the Admin can publish the catalogue.'}
            </p>
          </div>
        </div>

        {report?.can_publish && (
          <Link
            to="/publish"
            className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
          >
            <span>Go to Publish</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Errors Grouped List */}
      {report?.errors && report.errors.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-200 mb-4">Validation Issues ({report.errors.length})</h3>
          <div className="divide-y divide-slate-800">
            {report.errors.map((err, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {err.entity_type === 'artwork' ? (
                    <ImageIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Film className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {err.entity_type}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Field: <span className="text-brand-400 font-mono">{err.field}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{err.message}</p>
                  </div>
                </div>

                {err.entity_id && (
                  <Link
                    to={err.entity_type === 'show' ? `/shows/${err.entity_id}` : `/episodes/${err.entity_id}`}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    <span>Fix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
