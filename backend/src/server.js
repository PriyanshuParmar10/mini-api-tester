const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const dns = require("dns");
dns.setServers(["4.4.4.4", "8.8.8.8"]);

const Run = require('./models/Run');
const Result = require('./models/Result');
const { validateUrl } = require('./utils/safety');
const { executeRun } = require('./utils/executor');
const { generateTestCases } = require('./services/geminiService');
const { initWebSocketServer, broadcast } = require('./utils/websocket');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini_api_tester';

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mini API Tester Backend is running' });
});

/**
 * POST /api/runs
 * Start a new test run.
 * 1. Validates the provided URL and method.
 * 2. Enforces SSRF safety checks (blocks localhost/private IPs).
 * 3. Creates a Run in MongoDB.
 * 4. Asks Gemini for 10 edge cases (with fallback to 10 hardcoded cases).
 * 5. Broadcasts start event over WebSocket.
 * 6. Executes test cases sequentially and streams each result live via WebSocket.
 * 7. Broadcasts completion event over WebSocket.
 */
app.post('/api/runs', async (req, res) => {
  try {
    const { url, method = 'GET' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    const upperMethod = method.toUpperCase();
    if (!['GET', 'POST'].includes(upperMethod)) {
      return res.status(400).json({ error: 'Method must be either GET or POST.' });
    }

    // Safety validation (blocks localhost, 127.0.0.1, private IPs, non-http/https)
    const sanitizedUrl = await validateUrl(url);

    // Create the initial Run document in MongoDB
    const newRun = await Run.create({
      url: sanitizedUrl,
      method: upperMethod,
      status: 'pending',
    });

    // Generate 10 edge cases using Gemini (or fallback cases if invalid/no key)
    const testCases = await generateTestCases(sanitizedUrl, upperMethod, req.body.sampleBody);

    // Notify connected WebSocket clients that a run has started
    broadcast('RUN_START', {
      run: newRun,
      totalTests: testCases.length,
    });

    // Execute test cases sequentially, streaming each result live via WebSocket
    const results = await executeRun(newRun, testCases, (result, index, total) => {
      broadcast('TEST_RESULT', {
        runId: newRun._id,
        result,
        currentTest: index,
        totalTests: total,
      });
    });

    // Notify WebSocket clients that the run has completed
    broadcast('RUN_COMPLETE', {
      run: newRun,
    });

    // Return the completed run along with the recorded test results
    return res.status(201).json({
      success: true,
      run: newRun,
      results,
    });
  } catch (error) {
    console.error('Error during run execution:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to execute test run.',
    });
  }
});

/**
 * GET /api/runs
 * Get all runs (sorted by newest first).
 */
app.get('/api/runs', async (req, res) => {
  try {
    const runs = await Run.find().sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, runs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/runs/:id
 * Get details and results for a specific run by ID.
 */
app.get('/api/runs/:id', async (req, res) => {
  try {
    const run = await Run.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Run not found.' });
    }

    const results = await Result.find({ runId: run._id });
    return res.json({ success: true, run, results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create HTTP server instance to share with WebSocketServer
const server = http.createServer(app);

// Attach WebSocket server to the HTTP server
initWebSocketServer(server);

// Connect to MongoDB and start listening
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    server.listen(PORT, () => {
      console.log(`Mini API Tester Backend + WebSockets listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
