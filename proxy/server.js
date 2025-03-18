/**
 * AnimeChain Explorer API Proxy Server
 * 
 * This server acts as a proxy for the AnimeChain Explorer API to avoid CORS issues
 * when making requests from the frontend. It includes features such as:
 * - CORS handling
 * - Rate limiting
 * - Caching of responses
 * - Error handling
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3001;
const EXPLORER_BASE_URL = process.env.EXPLORER_BASE_URL || 'https://explorer-animechain-39xf6m45e3.t.conduit.xyz';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://animechainexplorer.com'];
const CACHE_TTL = process.env.CACHE_TTL || 30000; // 30 seconds default cache TTL

// Initialize Express app
const app = express();

// Setup logging
app.use(morgan('combined'));

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Simple in-memory cache
const cache = new Map();

// Cache middleware
const cacheMiddleware = (req, res, next) => {
  const cacheKey = req.originalUrl;
  const cachedResponse = cache.get(cacheKey);
  
  if (cachedResponse && cachedResponse.expiry > Date.now()) {
    console.log(`🔵 Cache hit for: ${cacheKey}`);
    return res.json(cachedResponse.data);
  }
  
  console.log(`🔴 Cache miss for: ${cacheKey}`);
  next();
};

// Periodically clean expired cache entries
setInterval(() => {
  const now = Date.now();
  cache.forEach((value, key) => {
    if (value.expiry <= now) {
      cache.delete(key);
    }
  });
}, 60000); // Clean every minute

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Blockchain stats endpoint
app.get('/api/blockchain/stats', cacheMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${EXPLORER_BASE_URL}/api/v2/stats`);
    
    // Store response in cache
    cache.set(req.originalUrl, {
      data: response.data,
      expiry: Date.now() + CACHE_TTL
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching blockchain stats:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch blockchain stats',
      details: error.message
    });
  }
});

// Transactions endpoint
app.get('/api/blockchain/transactions', cacheMiddleware, async (req, res) => {
  try {
    // Forward any query parameters
    const response = await axios.get(`${EXPLORER_BASE_URL}/api/v2/transactions`, {
      params: req.query
    });
    
    // Store response in cache
    cache.set(req.originalUrl, {
      data: response.data,
      expiry: Date.now() + CACHE_TTL
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch transactions',
      details: error.message
    });
  }
});

// Blocks endpoint
app.get('/api/blockchain/blocks', cacheMiddleware, async (req, res) => {
  try {
    // Forward any query parameters
    const response = await axios.get(`${EXPLORER_BASE_URL}/api/v2/blocks`, {
      params: req.query
    });
    
    // Store response in cache
    cache.set(req.originalUrl, {
      data: response.data,
      expiry: Date.now() + CACHE_TTL
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching blocks:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch blocks',
      details: error.message
    });
  }
});

// General proxy endpoint for any explorer endpoint
app.get('/api/blockchain/proxy', cacheMiddleware, async (req, res) => {
  try {
    const endpoint = req.query.endpoint;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }
    
    // Create a copy of the query parameters and remove the endpoint param
    const params = { ...req.query };
    delete params.endpoint;
    
    const response = await axios.get(`${EXPLORER_BASE_URL}/${endpoint}`, {
      params
    });
    
    // Store response in cache
    cache.set(req.originalUrl, {
      data: response.data,
      expiry: Date.now() + CACHE_TTL
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error proxying request to ${req.query.endpoint}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: `Failed to proxy request to ${req.query.endpoint}`,
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 AnimeChain Explorer Proxy Server running on port ${PORT}`);
  console.log(`📝 Configuration:`);
  console.log(`   - Explorer Base URL: ${EXPLORER_BASE_URL}`);
  console.log(`   - Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`   - Cache TTL: ${CACHE_TTL}ms`);
}); 