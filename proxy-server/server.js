/**
 * AnimeChain Explorer API Proxy Server
 * 
 * This standalone server acts as a proxy for the AnimeChain Explorer API,
 * handling CORS issues and providing additional features like caching and rate limiting.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const BASE_EXPLORER_URL = process.env.EXPLORER_API_URL || 
  'https://explorer-animechain-39xf6m45e3.t.conduit.xyz/api/v2';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://animechainexplorer.com').split(',');

// Setup rate limiter: max of 100 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute'
});

// Simple in-memory cache
const cache = {
  data: {},
  timestamps: {},
  ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 30000 // Default: 30 seconds cache lifetime
};

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Setup logging
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Middleware
app.use(morgan('combined', { stream: accessLogStream })); // Log all requests to access.log
app.use(morgan('dev')); // Log to console in development format
app.use(limiter); // Apply rate limiting to all requests

// Custom CORS middleware to handle multiple allowed origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Stats endpoint
app.get('/api/blockchain/stats', async (req, res) => {
  try {
    const cacheKey = 'stats';
    
    // Check cache first
    if (cache.data[cacheKey] && 
        (Date.now() - cache.timestamps[cacheKey] < cache.ttl)) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }
    
    // Fetch from the actual API
    console.log(`[CACHE MISS] ${cacheKey} - Fetching from explorer API`);
    const response = await axios.get(`${BASE_EXPLORER_URL}/stats`);
    
    // Cache the response
    cache.data[cacheKey] = response.data;
    cache.timestamps[cacheKey] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
});

// Transactions endpoint
app.get('/api/blockchain/transactions', async (req, res) => {
  try {
    // Get query parameters
    const queryString = new URLSearchParams(req.query).toString();
    const url = queryString ? 
      `${BASE_EXPLORER_URL}/transactions?${queryString}` : 
      `${BASE_EXPLORER_URL}/transactions`;
    
    // Transactions are frequently updated, so we use a shorter cache TTL
    const cacheKey = `transactions-${queryString}`;
    const txCacheTtl = Math.min(cache.ttl, 10000); // 10 seconds or less
    
    // Check cache first
    if (cache.data[cacheKey] && 
        (Date.now() - cache.timestamps[cacheKey] < txCacheTtl)) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }
    
    // Fetch from the actual API
    console.log(`[CACHE MISS] ${cacheKey} - Fetching from explorer API`);
    const response = await axios.get(url);
    
    // Cache the response
    cache.data[cacheKey] = response.data;
    cache.timestamps[cacheKey] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
});

// Blocks endpoint
app.get('/api/blockchain/blocks', async (req, res) => {
  try {
    // Get query parameters
    const queryString = new URLSearchParams(req.query).toString();
    const url = queryString ? 
      `${BASE_EXPLORER_URL}/blocks?${queryString}` : 
      `${BASE_EXPLORER_URL}/blocks`;
    
    const cacheKey = `blocks-${queryString}`;
    
    // Check cache first
    if (cache.data[cacheKey] && 
        (Date.now() - cache.timestamps[cacheKey] < cache.ttl)) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }
    
    // Fetch from the actual API
    console.log(`[CACHE MISS] ${cacheKey} - Fetching from explorer API`);
    const response = await axios.get(url);
    
    // Cache the response
    cache.data[cacheKey] = response.data;
    cache.timestamps[cacheKey] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching blocks:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
});

// General proxy endpoint for any explorer endpoint
app.get('/api/blockchain/proxy', async (req, res) => {
  try {
    const endpoint = req.query.endpoint;
    if (!endpoint) {
      return res.status(400).json({ error: "Missing required 'endpoint' query parameter" });
    }
    
    // Clone the query params and remove the endpoint parameter
    const queryParams = { ...req.query };
    delete queryParams.endpoint;
    
    // Build query string
    const queryString = new URLSearchParams(queryParams).toString();
    const url = queryString ? 
      `${BASE_EXPLORER_URL}/${endpoint}?${queryString}` : 
      `${BASE_EXPLORER_URL}/${endpoint}`;
    
    // Use a short cache for general endpoints
    const cacheKey = `proxy-${endpoint}-${queryString}`;
    
    // Check cache first
    if (cache.data[cacheKey] && 
        (Date.now() - cache.timestamps[cacheKey] < cache.ttl)) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cache.data[cacheKey]);
    }
    
    // Fetch from the actual API
    console.log(`[CACHE MISS] ${cacheKey} - Fetching from explorer API: ${url}`);
    const response = await axios.get(url);
    
    // Cache the response
    cache.data[cacheKey] = response.data;
    cache.timestamps[cacheKey] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`AnimeChain Proxy Server running on port ${PORT}`);
  console.log(`Base Explorer URL: ${BASE_EXPLORER_URL}`);
  console.log(`Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Cache TTL: ${cache.ttl}ms`);
});

// Simple cache cleanup
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  Object.keys(cache.timestamps).forEach(key => {
    if (now - cache.timestamps[key] > cache.ttl) {
      delete cache.data[key];
      delete cache.timestamps[key];
      expiredCount++;
    }
  });
  
  if (expiredCount > 0) {
    console.log(`[${new Date().toISOString()}] Cache cleanup - Removed ${expiredCount} items. Remaining: ${Object.keys(cache.data).length}`);
  }
}, 60000); // Clean up every minute

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Shutting down proxy server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down proxy server...');
  process.exit(0);
}); 