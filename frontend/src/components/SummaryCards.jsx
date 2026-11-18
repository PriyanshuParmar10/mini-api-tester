import React from 'react';

/**
 * SummaryCards component displays high-level metrics for the test run:
 * - Total test cases
 * - Passed count
 * - Failed count
 * - Average latency in milliseconds
 */
export default function SummaryCards({ results = [] }) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  const totalLatency = results.reduce((acc, r) => acc + (r.latencyMs || 0), 0);
  const avgLatency = total > 0 ? Math.round(totalLatency / total) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
      {/* Total Tests Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tests</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
      </div>

      {/* Passed Card */}
      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Passed</p>
        <p className="text-2xl font-bold text-emerald-700 mt-1">{passed}</p>
      </div>

      {/* Failed Card */}
      <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Failed</p>
        <p className="text-2xl font-bold text-rose-700 mt-1">{failed}</p>
      </div>

      {/* Average Latency Card */}
      <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-xs">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Avg Latency</p>
        <p className="text-2xl font-bold text-indigo-700 mt-1">
          {avgLatency} <span className="text-xs font-normal text-indigo-600">ms</span>
        </p>
      </div>
    </div>
  );
}
