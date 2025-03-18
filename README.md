# AnimeChain Explorer

A modern, responsive blockchain explorer for AnimeChain, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time blockchain statistics from the AnimeChain mainnet
- WebSocket connection to monitor live contract events
- Interactive JSON-RPC interface for direct blockchain interaction
- Configurable settings and environment variables
- Responsive design that works on desktop and mobile
- Standalone proxy server for handling API requests

## Installation

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AnimeChainExplorer.git
   cd AnimeChainExplorer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

To build the application for production:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Important Next.js Configuration Notes

This application uses dynamic API routes for proxying requests to the AnimeChain Explorer API. The Next.js configuration in `next.config.js` is set up for server-side rendering (SSR) mode rather than static export mode.

If you want to use static export (`next export`), you'll need to:

1. Update `next.config.js` to include:
   ```js
   output: 'export',
   images: {
     unoptimized: true,
   },
   ```

2. Remove the API routes and implement an alternative CORS solution, such as:
   - Using a CORS proxy service
   - Setting up a separate microservice to handle the API requests
   - Configuring the explorer backend to allow CORS from your origin

### Default Build Mode

The default build mode supports:
- Dynamic API routes for proxying requests
- Server-side rendering
- Client-side data fetching

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_ANIME_MAINNET_RPC_URL=https://rpc-animechain-39xf6m45e3.t.conduit.xyz
NEXT_PUBLIC_ANIME_MAINNET_WS_URL=wss://rpc-animechain-39xf6m45e3.t.conduit.xyz
```

## API Proxy for CORS Issues

The application uses a dedicated proxy server located at `proxy.animechainexplorer.com` to handle CORS issues when fetching data from the AnimeChain Explorer API. 

### Frontend Configuration

The frontend is configured to use the proxy server automatically via the `NEXT_PUBLIC_PROXY_URL` environment variable. If this variable is not set, it defaults to `https://proxy.animechainexplorer.com`.

### Available API Endpoints on the Proxy Server

- `/api/blockchain/stats` - Fetches general blockchain statistics
- `/api/blockchain/transactions` - Fetches transaction data (supports query parameters)
- `/api/blockchain/blocks` - Fetches block data (supports query parameters)
- `/api/blockchain/proxy?endpoint=<endpoint>` - General proxy for any explorer endpoint
- `/health` - Health check endpoint

## Standalone Proxy Server Setup

The project includes a standalone proxy server in the `proxy` directory. This server can be deployed separately from the main application to handle API requests and avoid CORS issues.

### Setup Instructions for Proxy Server

1. Navigate to the proxy server directory:
   ```bash
   cd proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the environment variables by creating a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   # Edit the .env file with your specific configuration
   ```

4. Start the proxy server:
   ```bash
   # For development with auto-reloading
   npm run dev
   
   # For production
   npm start
   ```

### Configuring a Domain for the Proxy Server

To set up the proxy server at `proxy.animechainexplorer.com`:

1. Deploy the proxy server to your hosting provider (e.g., DigitalOcean, AWS, Heroku, etc.)

2. Configure DNS settings for the subdomain `proxy.animechainexplorer.com` to point to your deployed server.

3. Set up a reverse proxy (such as Nginx or Apache) with SSL certificates.

### Example Nginx Configuration for the Proxy Server

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
        proxy_pass http://127.0.0.1:3001;  # Assuming your proxy server runs on port 3001
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

### Using PM2 for Production Deployment

It's recommended to use PM2 for running the proxy server in production:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the proxy server with PM2:
   ```bash
   pm2 start server.js --name "animechain-proxy"
   ```

3. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

### Troubleshooting Proxy Issues

If you encounter issues with the proxy server:

1. **Check Logs** - Check the server logs for error messages:
   ```bash
   # If running with PM2
   pm2 logs animechain-proxy
   
   # If running directly
   npm start
   ```

2. **Verify CORS Configuration** - Make sure the `ALLOWED_ORIGINS` environment variable includes your frontend domain.

3. **Test Connectivity** - Use a tool like `curl` to test API endpoints:
   ```bash
   curl https://proxy.animechainexplorer.com/health
   ```

4. **Check Firewall Settings** - Ensure your server's firewall allows traffic on the configured port.

5. **Verify Nginx Configuration** - If using Nginx, check the configuration and logs:
   ```bash
   nginx -t                           # Test configuration
   sudo systemctl restart nginx       # Restart Nginx
   sudo journalctl -u nginx           # Check Nginx logs
   ```

## Contributing

Contributions are welcome and appreciated! Here's how to contribute:

1. Fork the repository
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Commit your changes:
   ```bash
   git commit -m "Add some feature"
   ```
5. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Submit a pull request

### Pull Request Guidelines

- All pull requests should be submitted to the main repository's `main` branch
- Provide a clear description of the changes made
- Ensure your code follows the project's style guidelines
- Make sure all tests pass
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

