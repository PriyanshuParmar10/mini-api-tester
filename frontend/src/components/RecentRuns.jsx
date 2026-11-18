import React from 'react';

/**
 * RecentRuns displays previous test runs fetched from the backend.
 * Clicking any run loads its results into the dashboard.
 */
export default function RecentRuns({ runs = [], activeRunId, onSelectRun, onRefresh, isLoading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-sm">Previous Runs History</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {runs.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">No past runs recorded yet.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {runs.map((r) => {
            const isSelected = r._id === activeRunId;
            const dateStr = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <button
                key={r._id}
                type="button"
                onClick={() => onSelectRun(r._id)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-medium'
                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      r.method === 'POST' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {r.method}
                  </span>
                  <span className="text-[10px] text-slate-400">{dateStr}</span>
                </div>
                <p className="truncate text-slate-600 font-mono text-[11px]">{r.url}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
