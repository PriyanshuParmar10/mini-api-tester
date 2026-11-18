import React from 'react';

/**
 * ResultsTable displays each individual edge-case request result:
 * - Test input details / payload
 * - HTTP status code
 * - Latency in ms
 * - Pass / Fail indicator
 * - Error message if applicable
 */
export default function ResultsTable({ results = [] }) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <p className="text-base font-medium">No test results yet.</p>
        <p className="text-sm mt-1">Enter an API URL above and click "Run Edge Case Tests" to see results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Test Execution Results</h3>
        <span className="text-xs text-slate-500">{results.length} total requests</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Test Case & Input</th>
              <th className="py-3 px-4 w-28 text-center">Status Code</th>
              <th className="py-3 px-4 w-28 text-center">Latency</th>
              <th className="py-3 px-4 w-24 text-center">Result</th>
              <th className="py-3 px-4">Notes / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((res, index) => {
              // Extract test case name and payload
              const testName = res.input?.name || `Case #${index + 1}`;
              const testData = res.input?.data !== undefined ? res.input.data : res.input;

              // Color badge for status code
              let statusBadgeClass = 'bg-slate-100 text-slate-600';
              if (res.statusCode) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  statusBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                } else if (res.statusCode >= 400 && res.statusCode < 500) {
                  statusBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
                } else if (res.statusCode >= 500) {
                  statusBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-300';
                }
              }

              return (
                <tr key={res._id || index} className="hover:bg-slate-50/70 transition-colors">
                  {/* Row index */}
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                    {index + 1}
                  </td>

                  {/* Test case name and payload */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{testName}</p>
                    <pre className="mt-1 text-xs bg-slate-100 text-slate-700 p-2 rounded max-w-md overflow-x-auto font-mono">
                      {JSON.stringify(testData, null, 2)}
                    </pre>
                  </td>

                  {/* HTTP Status Code */}
                  <td className="py-3 px-4 text-center">
                    {res.statusCode ? (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass}`}>
                        {res.statusCode}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-xs font-medium">
                        None
                      </span>
                    )}
                  </td>

                  {/* Latency (in ms) */}
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-700 font-medium">
                    {res.latencyMs} ms
                  </td>

                  {/* Pass/Fail indicator */}
                  <td className="py-3 px-4 text-center">
                    {res.passed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                        Failed
                      </span>
                    )}
                  </td>

                  {/* Notes / Error info */}
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {res.error ? (
                      <span className="text-rose-600 font-medium">{res.error}</span>
                    ) : (
                      <span className="text-emerald-700">Handled gracefully</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
