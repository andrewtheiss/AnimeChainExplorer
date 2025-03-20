# AnimeChain Bridge

A web application for bridging ANIME tokens from Arbitrum to AnimeChain L3, built with Next.js, TypeScript, and Tailwind CSS.

## Overview

AnimeChain Bridge allows users to transfer their ANIME tokens from Arbitrum (L2) to AnimeChain (L3). The bridge operates as a one-way transfer mechanism, enabling seamless asset movement across these networks.

## Key Features

- One-way bridge from Arbitrum to AnimeChain
- MetaMask integration for secure wallet connection
- Raw contract calls for optimal gas efficiency
- Real-time balance checks and transaction monitoring
- Comprehensive transaction debugging information
- Responsive design that works on desktop and mobile

## Bridge Contract Details

- **Bridge Contract Address (Arbitrum)**: `0xA203252940839c8482dD4b938b4178f842E343D7`
- **ANIME Token Address (Arbitrum)**: `0x37a645648dF29205C6261289983FB04ECD70b4B3`
- **ANIME Token Address (Ethereum L1)**: `0x4DC26fC5854e7648a064a4ABD590bBE71724C277`

## How the Bridge Works

1. **Connect Wallet**: Users connect their MetaMask wallet to Arbitrum network
2. **Token Approval**: Users approve the bridge contract to spend their ANIME tokens
3. **Bridge Transaction**: The `createRetryableTicket` function is called on the bridge contract
4. **Token Transfer**: Tokens are locked on Arbitrum and minted on AnimeChain
5. **Transaction Verification**: Users can view their tokens on AnimeChain Explorer

## Technical Implementation

The bridge uses Arbitrum's `createRetryableTicket` function to send messages between layers. The implementation includes:

- Direct raw contract calls with method IDs for optimal gas usage
- Two-step process (approve + bridge) with option for direct deposit
- Error handling with detailed debugging information
- MetaMask event handling for account changes
- Automatic gas estimation with manual override options

## Usage Instructions

### Prerequisites

- MetaMask wallet with ANIME tokens on Arbitrum
- ETH for gas fees on Arbitrum

### Bridging Process

1. Connect your MetaMask wallet to the Arbitrum network
2. Enter the amount of ANIME tokens you want to bridge
3. Click "Step 1: Approve Tokens" to approve the bridge contract
4. Once approved, click "Step 2: Bridge Tokens" to initiate the transfer
5. Confirm the transaction in MetaMask
6. Wait for confirmation (typically takes a few minutes)
7. View your tokens on AnimeChain Explorer

## Installation

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AnimeChainBridge.git
   cd AnimeChainBridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

To build the application for production:

```bash
npm run build
npm start
```

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_ANIME_MAINNET_RPC_URL=https://rpc-animechain-39xf6m45e3.t.conduit.xyz
NEXT_PUBLIC_ANIME_MAINNET_WS_URL=wss://rpc-animechain-39xf6m45e3.t.conduit.xyz
```

## Bridge Logic Details

The bridge consists of two main components:

1. **Token Approval**: 
   - Uses ERC20 `approve` method (ID: `0x095ea7b3`)
   - Fallback to raw transaction if contract interface fails
   - Approves enough tokens for the bridge amount plus fees

2. **Token Bridge**:
   - Uses `createRetryableTicket` method for cross-chain messaging
   - Parameters include destination address, token amount, gas parameters, and calldata
   - Calculates proper fees to ensure successful message delivery

## Advanced Features

The application includes several advanced features accessible through the "Show Advanced Options" toggle:

- Contract Events monitoring for debugging
- JSON-RPC interface for direct blockchain interaction
- Blockchain statistics viewer
- Configuration settings

## Troubleshooting

If you encounter issues with the bridge:

1. **Check Token Balance**: Ensure you have sufficient ANIME tokens on Arbitrum
2. **Check ETH Balance**: You need ETH for gas fees on Arbitrum
3. **Network Issues**: Make sure you're connected to Arbitrum mainnet
4. **Gas Settings**: Try increasing gas limit if transactions fail
5. **Debug Info**: Use the debug information panel for detailed error messages

## Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m "Add some feature"`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

