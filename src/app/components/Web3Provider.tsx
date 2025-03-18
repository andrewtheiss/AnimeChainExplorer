"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import Web3 from 'web3';

// Constants
const CONTRACT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
const WEBSOCKET_URL = "wss://rpc-animechain-39xf6m45e3.t.conduit.xyz";

// Types
interface Web3ContextType {
  web3: Web3 | null;
  isConnected: boolean;
  events: any[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  contractAddress: string;
  websocketUrl: string;
}

// Context
const Web3Context = createContext<Web3ContextType | null>(null);

// Provider Component
export function Web3Provider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const web3Ref = useRef<Web3 | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Connect to blockchain
  const connect = async () => {
    try {
      setError(null);
      
      // Create a new web3 instance with WebSocket provider
      const provider = new Web3.providers.WebsocketProvider(WEBSOCKET_URL);
      const web3Instance = new Web3(provider);
      web3Ref.current = web3Instance;
      
      // Set up connection status handlers
      provider.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to AnimeChain blockchain");
      });
      
      provider.on("error", (err: any) => {
        console.error("Provider error:", err);
        setError(`Provider error: ${err.message || err}`);
        setIsConnected(false);
      });
      
      provider.on("end", () => {
        console.log("Connection ended");
        setIsConnected(false);
      });
      
      // Subscribe to contract events
      subscribeToEvents();
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(`Connection error: ${err.message || err}`);
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
      // Use type assertion to handle the callback TypeScript issue
      const web3 = web3Ref.current;
      const eth = web3.eth as any;
      
      const subscription = eth.subscribe('logs', {
        address: CONTRACT_ADDRESS
      }, (error: any, result: any) => {
        if (error) {
          console.error("Subscription error:", error);
          setError(`Subscription error: ${error.message || error}`);
          return;
        }
        
        // Add new event to the events list
        setEvents(prevEvents => [result, ...prevEvents].slice(0, 100)); // Keep last 100 events
      });
      
      subscriptionRef.current = subscription;
    } catch (err: any) {
      console.error("Subscription setup error:", err);
      setError(`Subscription setup error: ${err.message || err}`);
    }
  };

  // Disconnect from blockchain
  const disconnect = () => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (web3Ref.current && web3Ref.current.currentProvider && 
          typeof web3Ref.current.currentProvider !== 'string' && 
          'disconnect' in web3Ref.current.currentProvider) {
        (web3Ref.current.currentProvider as any).disconnect();
      }
      
      web3Ref.current = null;
      setIsConnected(false);
      setEvents([]);
      console.log("Disconnected from blockchain");
    } catch (err: any) {
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
        websocketUrl: WEBSOCKET_URL
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