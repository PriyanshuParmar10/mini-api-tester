const Result = require('../models/Result');
const Run = require('../models/Run');

// 3 hardcoded edge-case test cases (used in Step 1 and as fallback for Gemini in Step 3)
const HARDCODED_TEST_CASES = {
  // Edge cases for POST requests
  POST: [
    { name: 'Empty payload', data: {} },
    { name: 'Very long text and negative number', data: { title: 'A'.repeat(300), count: -9999 } },
    { name: 'Special characters and wrong data types', data: { symbols: '<script>alert("test")</script>', age: 'not-a-number', flag: null } },
  ],
  // Edge cases for GET requests (sent as query parameters)
  GET: [
    { name: 'Base request (empty query)', data: {} },
    { name: 'Negative numbers and long query', data: { limit: -1, search: 'A'.repeat(200) } },
    { name: 'Special characters and symbols', data: { filter: '!@#$%^&*()_+{}[]:;"\'<>?,./', active: 'maybe' } },
  ],
};

/**
 * Executes a single HTTP request against the target API.
 * Measures response time (latency) and applies a strict 5-second timeout.
 *
 * @param {string} runId - The ID of the parent Run
 * @param {string} url - Target API URL
 * @param {string} method - 'GET' or 'POST'
 * @param {object} testCase - Test case containing name and data
 * @returns {Promise<object>} Created Result document
 */
async function executeSingleTest(runId, url, method, testCase) {
  const startTime = Date.now();
  let statusCode = null;
  let passed = false;
  let errorMessage = null;

  try {
    let targetUrl = url;
    const fetchOptions = {
      method: method,
      // 5-second timeout enforced using native AbortSignal
      signal: AbortSignal.timeout(5000),
      headers: {
        'Accept': 'application/json',
      },
    };

    if (method === 'POST') {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(testCase.data || {});
    } else if (method === 'GET' && testCase.data && Object.keys(testCase.data).length > 0) {
      // For GET requests, convert testCase data to query parameters
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(testCase.data)) {
        params.append(key, value === null ? '' : String(value));
      }
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}${params.toString()}`;
    }

    // Perform the HTTP request
    const response = await fetch(targetUrl, fetchOptions);
    statusCode = response.status;

    // A test is considered "passed" if the server handled it gracefully
    // (Status code 200-499: the server responded properly, even with 400 Bad Request,
    // rather than crashing with 500 Internal Server Error)
    passed = statusCode >= 200 && statusCode < 500;
    if (!passed) {
      errorMessage = `Server returned 5xx error status code: ${statusCode}`;
    }
  } catch (err) {
    passed = false;
    if (err.name === 'TimeoutError') {
      errorMessage = 'Request timed out after 5 seconds (5000ms)';
    } else {
      errorMessage = err.message || 'Network request failed';
    }
  }

  const latencyMs = Date.now() - startTime;

  // Save the result to MongoDB
  const savedResult = await Result.create({
    runId,
    input: testCase,
    statusCode,
    latencyMs,
    passed,
    error: errorMessage,
  });

  return savedResult;
}

/**
 * Runs test cases sequentially for a given Run.
 * Enforces:
 * 1. Max 10 requests per run.
 * 2. Sequential execution (one request at a time).
 * 3. Updates Run status to 'completed' or 'failed'.
 *
 * @param {object} run - Mongoose Run document
 * @param {Array} customTestCases - Optional test cases (defaults to 3 hardcoded cases)
 * @param {Function} onResult - Optional callback invoked after each test case executes
 * @returns {Promise<Array>} List of Result documents
 */
async function executeRun(run, customTestCases = null, onResult = null) {
  // Use provided test cases or fallback to the 3 hardcoded cases
  const availableCases = (customTestCases && customTestCases.length > 0)
    ? customTestCases
    : (HARDCODED_TEST_CASES[run.method] || HARDCODED_TEST_CASES.GET);

  // Safety constraint: Maximum 10 requests per run
  const testCasesToRun = availableCases.slice(0, 10);

  const results = [];

  try {
    // Update status to 'running'
    run.status = 'running';
    await run.save();

    // Execute sequentially one-by-one
    for (let i = 0; i < testCasesToRun.length; i++) {
      const testCase = testCasesToRun[i];
      const result = await executeSingleTest(run._id, run.url, run.method, testCase);
      results.push(result);

      // Notify live listener via callback (used for WebSocket streaming)
      if (typeof onResult === 'function') {
        onResult(result, i + 1, testCasesToRun.length);
      }
    }

    // Mark run as completed
    run.status = 'completed';
    await run.save();
  } catch (error) {
    run.status = 'failed';
    await run.save();
    throw error;
  }

  return results;
}

module.exports = {
  HARDCODED_TEST_CASES,
  executeSingleTest,
  executeRun,
};
