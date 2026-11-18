const mongoose = require('mongoose');

// Schema for tracking a test run session
const runSchema = new mongoose.Schema({
  // The API endpoint URL to test
  url: {
    type: String,
    required: [true, 'API URL is required'],
    trim: true,
  },
  // HTTP method: GET or POST
  method: {
    type: String,
    required: [true, 'HTTP method is required'],
    enum: ['GET', 'POST'],
    uppercase: true,
  },
  // Status of the run: pending, running, completed, or failed
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  },
  // When this run was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Run', runSchema);
