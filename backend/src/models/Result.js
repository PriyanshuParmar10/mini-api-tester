const mongoose = require('mongoose');

// Schema for tracking individual test case results
const resultSchema = new mongoose.Schema({
  // Reference to the parent Run document
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Run',
    required: [true, 'runId is required'],
  },
  // The input payload or query sent to the target API
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // HTTP status code returned by target API (e.g. 200, 400, 500, or null if connection failed)
  statusCode: {
    type: Number,
    default: null,
  },
  // Latency in milliseconds (how long the request took)
  latencyMs: {
    type: Number,
    required: true,
  },
  // Whether the test passed (true if server handled edge case gracefully without 500/crash)
  passed: {
    type: Boolean,
    required: true,
  },
  // Any error message (e.g. timeout, connection error, or 5xx error description)
  error: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Result', resultSchema);
