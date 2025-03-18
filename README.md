# AnimeChain Explorer

A modern, responsive blockchain explorer for AnimeChain, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time blockchain statistics from the AnimeChain mainnet
- WebSocket connection to monitor live contract events
- Interactive JSON-RPC interface for direct blockchain interaction
- Configurable settings and environment variables
- Responsive design that works on desktop and mobile

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

The application uses local API routes to handle CORS issues when fetching data from the AnimeChain Explorer API. The proxies are implemented using Next.js API routes under `src/app/api/blockchain/`.

### Available API Routes

- `/api/blockchain/stats` - Fetches general blockchain statistics
- `/api/blockchain/transactions` - Fetches transaction data (supports query parameters)
- `/api/blockchain/proxy?endpoint=<endpoint>` - General proxy for any explorer endpoint

### Important Configuration Notes

All API routes are configured with:
- `export const dynamic = 'force-dynamic'` - Ensures routes are always generated at request time
- `export const revalidate = 0` - Prevents caching of API responses

These settings are required for proper functionality in both development and production modes.

### Usage Examples

```typescript
// Fetch blockchain stats
const statsResponse = await fetch('/api/blockchain/stats');
const stats = await statsResponse.json();

// Fetch transactions with query parameters
const txResponse = await fetch('/api/blockchain/transactions?page=1&items=10');
const transactions = await txResponse.json();

// Use the general proxy for any endpoint
const blocksResponse = await fetch('/api/blockchain/proxy?endpoint=blocks&page=1');
const blocks = await blocksResponse.json();
```

### Troubleshooting CORS Issues

If you encounter CORS errors when running the application locally:

1. **Verify Next.js Configuration** - Make sure `next.config.js` does NOT have `output: 'export'` enabled if you're using API routes.

2. **Verify API Routes** - Make sure you're using the application's built-in API routes instead of direct calls to external APIs.

3. **Check Dynamic Export Configuration** - All API route files must include `export const dynamic = 'force-dynamic'` at the top of the file to work correctly.

4. **Clear Cache** - Try clearing your browser cache or using incognito mode.

5. **Restart Development Server** - Sometimes a simple restart of the development server can resolve issues:
   ```bash
   # Press Ctrl+C to stop the server, then:
   npm run dev
   ```

6. **Check Network Logs** - Use your browser's developer tools to check the network tab for specific error messages.

7. **Proxy All Requests** - If you're still having issues with a specific endpoint, use the general proxy route (`/api/blockchain/proxy?endpoint=...`) which can handle any explorer endpoint.

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

