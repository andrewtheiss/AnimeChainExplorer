"use client";

import React, { useState, useEffect } from 'react';

// Define types for the stats response
interface BlockchainStats {
  average_block_time: number;
  coin_image: string | null;
  coin_price: string | null;
  coin_price_change_percentage: number | null;
  gas_price_updated_at: string;
  gas_prices: Record<string, unknown>;
  gas_prices_update_in: number;
  gas_used_today: string;
  market_cap: string;
  network_utilization_percentage: number;
  secondary_coin_image: string | null;
  secondary_coin_price: string | null;
  static_gas_price: string | null;
  total_addresses: string;
  total_blocks: string;
  total_gas_used: string;
  total_transactions: string;
  transactions_today: string;
  tvl: string | null;
}

interface BlockchainStatsProps {
  refreshInterval?: number; // in milliseconds
}

export default function BlockchainStats({ refreshInterval = 60000 }: BlockchainStatsProps) {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Explorer API URL - mainnet
  const EXPLORER_API_URL = "https://explorer-animechain-39xf6m45e3.t.conduit.xyz/api/v2/stats";

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(EXPLORER_API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as BlockchainStats;
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching blockchain stats:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching blockchain stats: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format large numbers with commas
  const formatNumber = (numStr: string) => {
    return parseInt(numStr).toLocaleString();
  };

  // Format time in ms to readable format
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const minutes = seconds / 60;
    return `${minutes.toFixed(2)}m`;
  };

  // Fetch data on component mount and set up interval
  useEffect(() => {
    // Initial fetch
    fetchStats();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchStats, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">AnimeChain Mainnet Stats</h2>
        <button 
          onClick={fetchStats}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 mb-4">
          {error}
        </div>
      )}
      
      {isLoading && !stats && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      )}
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Total Blocks</h3>
            <p className="text-xl font-semibold">{formatNumber(stats.total_blocks)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Total Transactions</h3>
            <p className="text-xl font-semibold">{formatNumber(stats.total_transactions)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Transactions Today</h3>
            <p className="text-xl font-semibold">{formatNumber(stats.transactions_today)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Avg Block Time</h3>
            <p className="text-xl font-semibold">{formatTime(stats.average_block_time)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Gas Used Today</h3>
            <p className="text-xl font-semibold">{formatNumber(stats.gas_used_today)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Total Addresses</h3>
            <p className="text-xl font-semibold">{formatNumber(stats.total_addresses)}</p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="text-gray-300 text-sm mb-1">Network Utilization</h3>
            <p className="text-xl font-semibold">
              {(stats.network_utilization_percentage * 100).toFixed(6)}%
            </p>
          </div>
        </div>
      )}
      
      {lastUpdated && (
        <div className="mt-4 text-right text-sm text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
} 