"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import Web3 from 'web3';
import { config } from '../config';

// Define proper types for blockchain events
interface BlockchainEvent {
  blockNumber?: string;
  transactionHash?: string;
  logIndex?: string;
  data?: string;
  [key: string]: unknown;
}

// Define Ethereum window interface for MetaMask
interface EthereumWindow extends Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}

// Types for custom WebSocket provider
interface WebSocketProviderEvents {
  connect: () => void;
  error: (error: Error) => void;
  end: () => void;
  disconnect: () => void;
}

interface WebSocketProvider {
  on<K extends keyof WebSocketProviderEvents>(event: K, callback: WebSocketProviderEvents[K]): void;
  disconnect?: () => void;
}

// Type for Web3 provider
type SupportedProvider = string | object;

// Custom type for Web3 instance with proper provider typing
type Web3Instance = Web3 & {
  currentProvider: unknown;
};

// Custom type for Web3.eth with subscribe method
interface EthSubscribe {
  subscribe: (
    type: string, 
    options: { address: string },
    callback: (error: Error | null, result: BlockchainEvent) => void
  ) => { unsubscribe: () => void };
}

// Constants from config
const CONTRACT_ADDRESS = config.animeChain.entryPointAddress;
const WEBSOCKET_URL = config.animeChain.mainnet.wsUrl;

// Types
interface Web3ContextType {
  web3: Web3Instance | null;
  isConnected: boolean;
  events: BlockchainEvent[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  contractAddress: string;
  websocketUrl: string;
  account: string | null;
}

// Context
const Web3Context = createContext<Web3ContextType | null>(null);

// Provider Component
export function Web3Provider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const web3Ref = useRef<Web3Instance | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Connect to blockchain
  const connect = async () => {
    try {
      setError(null);
      
      // Check if MetaMask is available
      const ethereum = (window as unknown as EthereumWindow).ethereum;
      
      if (ethereum) {
        try {
          // Request account access
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            const account = accounts[0];
            setAccount(account);
            
            // Create Web3 instance with MetaMask provider
            const web3Instance = new Web3(ethereum as any) as Web3Instance;
            web3Ref.current = web3Instance;
            
            // Set up MetaMask account change listener
            const handleAccountsChanged = (accounts: string[]) => {
              if (accounts.length === 0) {
                // User disconnected their wallet
                disconnect();
              } else {
                setAccount(accounts[0]);
              }
            };
            
            ethereum.on('accountsChanged', handleAccountsChanged);
            
            setIsConnected(true);
            console.log("Connected to blockchain via MetaMask");
            
            // Subscribe to contract events
            subscribeToEvents();
            
            return;
          }
        } catch (metaMaskErr) {
          console.error("MetaMask connection error:", metaMaskErr);
          // Fall back to WebSocket provider
        }
      }
      
      // Fallback: Create a new web3 instance with WebSocket provider
      const provider = new Web3.providers.WebsocketProvider(WEBSOCKET_URL) as unknown as WebSocketProvider;
      // Use type assertion to make the provider compatible with Web3 constructor
      const web3Instance = new Web3(provider as SupportedProvider) as Web3Instance;
      web3Ref.current = web3Instance;
      
      // Set up connection status handlers
      provider.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to AnimeChain blockchain via WebSocket");
        
        // Try to get the first account as the default account
        web3Instance.eth.getAccounts().then(accounts => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        }).catch(err => {
          console.error("Error getting accounts:", err);
        });
      });
      
      provider.on("error", (err: Error) => {
        console.error("Provider error:", err);
        setError(`Provider error: ${err.message}`);
        setIsConnected(false);
      });
      
      provider.on("end", () => {
        console.log("Connection ended");
        setIsConnected(false);
      });
      
      // Subscribe to contract events
      subscribeToEvents();
    } catch (err) {
      console.error("Connection error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection error: ${errorMessage}`);
      setIsConnected(false);
    }
  };

  // Subscribe to contract events
  const subscribeToEvents = () => {
    if (!web3Ref.current) return;
    
    try {
      // Clear any existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      // Subscribe to logs for the specified contract address
      const web3 = web3Ref.current;
      const eth = web3.eth as unknown as EthSubscribe;
      
      const subscription = eth.subscribe('logs', {
        address: CONTRACT_ADDRESS
      }, (error: Error | null, result: BlockchainEvent) => {
        if (error) {
          console.error("Subscription error:", error);
          setError(`Subscription error: ${error.message}`);
          return;
        }
        
        // Add new event to the events list
        setEvents(prevEvents => [result, ...prevEvents].slice(0, 100)); // Keep last 100 events
      });
      
      subscriptionRef.current = subscription;
    } catch (err) {
      console.error("Subscription setup error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Subscription setup error: ${errorMessage}`);
    }
  };

  // Disconnect from blockchain
  const disconnect = () => {
    try {
      // Remove MetaMask event listeners if they exist
      const ethereum = (window as unknown as EthereumWindow).ethereum;
      if (ethereum) {
        // Since we can't reference the original handler directly, disconnection 
        // will happen but event handlers won't be removed. This is a limitation.
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (web3Ref.current && web3Ref.current.currentProvider) {
        const provider = web3Ref.current.currentProvider as unknown as WebSocketProvider;
        if (provider && typeof provider !== 'string' && provider.disconnect) {
          provider.disconnect();
        }
      }
      
      setAccount(null);
      web3Ref.current = null;
      setIsConnected(false);
      setEvents([]);
      console.log("Disconnected from blockchain");
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        web3: web3Ref.current,
        isConnected,
        events,
        error,
        connect,
        disconnect,
        contractAddress: CONTRACT_ADDRESS,
        websocketUrl: WEBSOCKET_URL,
        account
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// Custom hook to use the Web3 context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
} 