import React, { useState, useEffect, useRef } from 'react';
import TestForm from './components/TestForm';
import SummaryCards from './components/SummaryCards';
import ResultsTable from './components/ResultsTable';
import RecentRuns from './components/RecentRuns';

const API_BASE_URL = 'https://mini-api-tester-fyjm.onrender.com/';
const WS_URL = 'ws://localhost:5000';

export default function App() {
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Keep a ref to activeRun to verify incoming test results
  const activeRunRef = useRef(activeRun);
  useEffect(() => {
    activeRunRef.current = activeRun;
  }, [activeRun]);

  // Fetch list of all historical runs from backend
  const fetchRuns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/runs`);
      const data = await res.json();
      if (data.success && Array.isArray(data.runs)) {
        setRuns(data.runs);
      }
    } catch (err) {
      console.error('Failed to load past runs:', err);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  // WebSocket Connection for Real-Time Live Streaming
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to backend');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Event 1: Run has started
          if (message.type === 'RUN_START') {
            setActiveRun(message.run);
            setResults([]); // Clear previous results for fresh live stream
            setIsLoading(true);
            setError(null);
          }

          // Event 2: A single test finished -> Streamed live!
          else if (message.type === 'TEST_RESULT') {
            // Append incoming test result live to the results list
            setResults((prevResults) => {
              // Avoid duplicates if any
              const exists = prevResults.some((r) => r._id === message.result._id);
              if (exists) return prevResults;
              return [...prevResults, message.result];
            });
          }

          // Event 3: All tests in this run completed
          else if (message.type === 'RUN_COMPLETE') {
            setActiveRun(message.run);
            setIsLoading(false);
            fetchRuns();
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing incoming message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected. Retrying in 3 seconds...');
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Connection error:', err);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handle form submission to trigger a new run
  const handleRunTest = async (payload) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server returned an error executing tests.');
      }

      // Sync completed data from HTTP response
      setActiveRun(data.run);
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      }
      await fetchRuns();
    } catch (err) {
      setError(err.message || 'An error occurred while running the test.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch details and results of a selected historical run
  const handleSelectRun = async (runId) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/runs/${runId}`);
      const data = await res.json();
      if (data.success) {
        setActiveRun(data.run);
        setResults(data.results || []);
      }
    } catch (err) {
      setError('Failed to fetch details for the selected run.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Navbar / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              API
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Mini API Tester</h1>
              <p className="text-xs text-slate-400">Automated Edge-Case & Latency Benchmarks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live WebSocket Connection Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                wsConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {wsConnected ? 'WebSocket Live' : 'Connecting WS...'}
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Step 4: WebSocket Updates
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Error Alert Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between">
            <div>
              <p className="font-semibold">Execution Error</p>
              <p className="mt-0.5 text-xs text-rose-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Test Configuration Form and History */}
          <div className="lg:col-span-1 space-y-6">
            <TestForm onSubmit={handleRunTest} isLoading={isLoading} />
            <RecentRuns
              runs={runs}
              activeRunId={activeRun?._id}
              onSelectRun={handleSelectRun}
              onRefresh={fetchRuns}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Metrics and Results Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Run Header with Live Progress indicator */}
            {activeRun && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      activeRun.method === 'POST' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeRun.method}
                  </span>
                  <span className="font-mono text-xs text-slate-700 truncate max-w-sm sm:max-w-md">
                    {activeRun.url}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                      Testing ({results.length}/10)...
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Status: <strong className="text-slate-700 capitalize">{isLoading ? 'running' : activeRun.status}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Metric Summary Cards (Live Updating!) */}
            <SummaryCards results={results} />

            {/* Detailed Results Table (Live Streaming!) */}
            <ResultsTable results={results} />
          </div>
        </div>
      </main>
    </div>
  );
}
