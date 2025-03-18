# AnimeChain Explorer Proxy Server

A standalone proxy server for AnimeChain Explorer API requests, designed to handle CORS issues and provide caching, rate limiting, and error handling.

## Features

- **CORS Handling**: Properly configured CORS to allow requests from specified origins
- **Caching**: In-memory cache with configurable TTL to reduce load on the Explorer API
- **Rate Limiting**: Prevents abuse by limiting requests per IP address
- **Error Handling**: Proper error responses and logging
- **Configurable**: Environment variables for easy configuration

## Quick Start

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit the .env file with your specific configuration
   ```

3. Start the server:
   ```bash
   # For development with auto-reloading
   npm run dev
   
   # For production
   npm start
   ```

## API Endpoints

- **`GET /health`** - Health check endpoint
- **`GET /api/blockchain/stats`** - Fetches blockchain statistics
- **`GET /api/blockchain/transactions`** - Fetches transactions with optional query parameters
- **`GET /api/blockchain/blocks`** - Fetches blocks with optional query parameters
- **`GET /api/blockchain/proxy?endpoint=<endpoint>`** - General proxy for any explorer endpoint

## Configuration

Configure the server using environment variables in a `.env` file:

```
# Server settings
PORT=3001

# Explorer API settings
EXPLORER_BASE_URL=https://explorer-animechain-39xf6m45e3.t.conduit.xyz

# CORS settings - comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,https://animechainexplorer.com

# Cache settings
CACHE_TTL=30000  # Time in milliseconds (30 seconds)
```

## Deployment

### Running with PM2

For production environments, it's recommended to use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
pm2 start server.js --name "animechain-proxy"

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### Running with Docker

A Dockerfile is included for containerized deployment:

```bash
# Build the Docker image
docker build -t animechain-proxy .

# Run the container
docker run -p 3001:3001 --env-file .env animechain-proxy
```

### Nginx Configuration

If using Nginx as a reverse proxy, here's a sample configuration:

```nginx
server {
    listen 80;
    server_name proxy.animechainexplorer.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name proxy.animechainexplorer.com;
    
    # SSL configuration
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the `ALLOWED_ORIGINS` environment variable includes your frontend domain.

2. **Connection Refused**: Verify the server is running and the port is not blocked by a firewall.

3. **API Errors**: Check that `EXPLORER_BASE_URL` is correct and the Explorer API is accessible.

### Logs

Check logs for error messages:

```bash
# If running with PM2
pm2 logs animechain-proxy

# If running directly
npm start
```

## Development

### Code Structure

- `server.js` - Main entry point containing the Express server configuration
- `.env` - Environment variables for configuration
- `package.json` - Dependencies and scripts

### Adding New Endpoints

To add a new endpoint to the proxy server:

1. Add a new route in `server.js`:
   ```javascript
   app.get('/api/blockchain/new-endpoint', cacheMiddleware, async (req, res) => {
     try {
       const response = await axios.get(`${EXPLORER_BASE_URL}/api/v2/new-endpoint`, {
         params: req.query
       });
       
       // Store response in cache
       cache.set(req.originalUrl, {
         data: response.data,
         expiry: Date.now() + CACHE_TTL
       });
       
       res.json(response.data);
     } catch (error) {
       console.error('Error fetching data:', error.message);
       res.status(error.response?.status || 500).json({
         error: 'Failed to fetch data',
         details: error.message
       });
     }
   });
   ```

2. Update the README to document the new endpoint

## License

MIT 