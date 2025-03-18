# AnimeChain Explorer

A real-time blockchain explorer for AnimeChain that monitors and displays events from a specific contract.

## Features

- Connect to AnimeChain blockchain via WebSocket
- Subscribe to contract events from the EntryPoint contract (0x0000000071727De22E5E9d8BAf0edAc6f37da032)
- Real-time display of blockchain events
- Detailed event information with raw data viewing
- Connection status indicator
- Responsive design

## Technology Stack

- **Next.js** - React framework for the application
- **TypeScript** - Type safety for JavaScript
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Web3.js** - Ethereum JavaScript API for blockchain interaction

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/anime-chain-explorer.git
   cd anime-chain-explorer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Click the "Connect to AnimeChain" button to establish a WebSocket connection to the blockchain.
2. Once connected, the application will start listening for events from the specified contract address.
3. Events will be displayed in real-time as they occur on the blockchain.
4. You can view detailed information for each event, including the raw event data.
5. Click "View Contract Info" to open the contract address in a blockchain explorer.
6. Click "Disconnect" to close the WebSocket connection.

## Project Structure

- `src/app/page.tsx` - Main page component
- `src/app/components/Web3Provider.tsx` - Web3 context provider for blockchain connection
- `src/app/components/EventCard.tsx` - Component to display individual blockchain events
- `src/app/layout.tsx` - Root layout component
- `src/app/globals.css` - Global styles

## License

MIT

## Acknowledgements

- [AnimeChain](https://animechain.com) - Blockchain network
- [Next.js](https://nextjs.org/)
- [Web3.js](https://web3js.readthedocs.io/)
