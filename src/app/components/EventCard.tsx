"use client";

import React, { useState } from 'react';

interface EventCardProps {
  event: any;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    } catch (e) {
      return hex;
    }
  };

  return (
    <div className="p-4 bg-slate-700/30 rounded-lg break-all transition-all duration-200 hover:bg-slate-700/50">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <span className="font-semibold text-gray-300">Block Number:</span>
        <span>{tryDecodeHex(event.blockNumber)}</span>
        
        <span className="font-semibold text-gray-300">Transaction Hash:</span>
        <span className="truncate hover:text-blue-400">
          <a 
            href={`https://explorer.animechain.com/tx/${event.transactionHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {event.transactionHash}
          </a>
        </span>
        
        <span className="font-semibold text-gray-300">Log Index:</span>
        <span>{tryDecodeHex(event.logIndex)}</span>
        
        <span className="font-semibold text-gray-300">Data:</span>
        <span className="truncate">{formatData(event.data)}</span>
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