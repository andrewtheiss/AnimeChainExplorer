"use client";

import React from 'react';

// Define proper types for blockchain events
interface BlockchainEvent {
  blockNumber?: string;
  transactionHash?: string;
  logIndex?: string;
  data?: string;
  timestamp?: string;
  [key: string]: unknown; // Use unknown instead of any for better type safety
}

interface EventCardProps {
  event: BlockchainEvent;
}

export default function EventCard({ event }: EventCardProps) {
  // Format data in a more readable way if possible
  const formatData = (data: string) => {
    if (!data) return "N/A";
    
    // If data is just "0x", return that
    if (data === "0x") return data;
    
    // If it's a longer hex string, truncate it
    if (data.length > 66) {
      return `${data.substring(0, 30)}...${data.substring(data.length - 10)}`;
    }
    
    return data;
  };

  // Try to decode hex numbers to decimal
  const tryDecodeHex = (hex: string | undefined) => {
    if (!hex) return "N/A";
    try {
      return parseInt(hex, 16).toString();
    } catch {
      // No need to reference the error if we're not using it
      return hex;
    }
  };

  // Format timestamp if available
  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp || typeof timestamp !== 'string') return null;
    
    try {
      // If it's a hex number, try to convert
      let timestampNum = timestamp;
      if (timestamp.startsWith('0x')) {
        timestampNum = parseInt(timestamp, 16).toString();
      }
      
      // Convert to date
      const date = new Date(parseInt(timestampNum) * 1000);
      return date.toLocaleString();
    } catch {
      return null;
    }
  };
  
  // The mainnet explorer URL
  const explorerUrl = "https://explorer-animechain-39xf6m45e3.t.conduit.xyz";

  return (
    <div className="p-4 bg-slate-700/30 rounded-lg break-all transition-all duration-200 hover:bg-slate-700/50">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <span className="font-semibold text-gray-300">Block Number:</span>
        <span>
          <a 
            href={`${explorerUrl}/block/${tryDecodeHex(event.blockNumber)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            {tryDecodeHex(event.blockNumber)}
          </a>
        </span>
        
        <span className="font-semibold text-gray-300">Transaction Hash:</span>
        <span className="truncate hover:text-blue-400">
          <a 
            href={`${explorerUrl}/tx/${event.transactionHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {event.transactionHash}
          </a>
        </span>
        
        <span className="font-semibold text-gray-300">Log Index:</span>
        <span>{tryDecodeHex(event.logIndex)}</span>
        
        <span className="font-semibold text-gray-300">Data:</span>
        <span className="truncate">{formatData(event.data || '')}</span>
        
        {event.timestamp && (
          <>
            <span className="font-semibold text-gray-300">Timestamp:</span>
            <span>{formatTimestamp(event.timestamp) || event.timestamp}</span>
          </>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-slate-600">
        <details>
          <summary className="cursor-pointer text-blue-400 hover:text-blue-300">View Raw Data</summary>
          <pre className="mt-2 p-2 bg-slate-800 rounded text-xs overflow-x-auto">
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
} 