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

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_ANIME_MAINNET_RPC_URL=https://rpc-animechain-39xf6m45e3.t.conduit.xyz
NEXT_PUBLIC_ANIME_MAINNET_WS_URL=wss://rpc-animechain-39xf6m45e3.t.conduit.xyz
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

