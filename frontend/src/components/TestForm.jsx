import React, { useState } from 'react';

/**
 * TestForm allows the user to specify:
 * - API URL (e.g. https://jsonplaceholder.typicode.com/posts)
 * - HTTP Method (GET or POST)
 * - Optional description or sample JSON body
 * - Quick presets for convenient 1-click testing
 */
export default function TestForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
  const [method, setMethod] = useState('POST');
  const [sampleBody, setSampleBody] = useState('{\n  "title": "Sample Post",\n  "body": "Hello World",\n  "userId": 1\n}');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    let parsedBody = null;
    if (method === 'POST' && sampleBody.trim()) {
      try {
        parsedBody = JSON.parse(sampleBody);
      } catch (err) {
        alert('Invalid JSON in sample body. Please format as valid JSON or leave it empty.');
        return;
      }
    }

    onSubmit({
      url: url.trim(),
      method,
      sampleBody: parsedBody,
    });
  };

  // Preset helpers for convenient student testing
  const applyPreset = (presetUrl, presetMethod, presetBody = '') => {
    setUrl(presetUrl);
    setMethod(presetMethod);
    setSampleBody(presetBody);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Configure API Test</h2>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs font-semibold text-slate-500 uppercase">Presets:</span>
        <button
          type="button"
          onClick={() => applyPreset('https://jsonplaceholder.typicode.com/posts', 'POST', '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}')}
          className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
        >
          JSONPlaceholder POST
        </button>
        <button
          type="button"
          onClick={() => applyPreset('https://jsonplaceholder.typicode.com/posts', 'GET', '')}
          className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
        >
          JSONPlaceholder GET
        </button>
        <button
          type="button"
          onClick={() => applyPreset('https://httpbin.org/get', 'GET', '')}
          className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
        >
          HttpBin GET
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL and Method row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Method selector */}
          <div className="w-full md:w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">API Endpoint URL</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/api/resource"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Optional Sample Body (mainly for POST) */}
        {method === 'POST' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Sample Body / Schema (Optional JSON)
            </label>
            <textarea
              rows={4}
              value={sampleBody}
              onChange={(e) => setSampleBody(e.target.value)}
              placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              This sample body will be used by Gemini in Step 3 to generate relevant edge cases.
            </p>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full md:w-auto px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-colors shadow-xs ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running Test Cases...
              </span>
            ) : (
              'Run Edge Case Tests'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
