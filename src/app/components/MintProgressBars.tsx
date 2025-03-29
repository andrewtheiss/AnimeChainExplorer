"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABI for the specific contract functions we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "guaranteedTotalMax",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "guaranteedTotalMinted",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalNFTMax",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalNFTMinted",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getUnusedRaffleEntries",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}, {"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Constants
const CONTRACT_ADDRESS = "0x0CA9229a48a154C62F8398e52a8fE082E9587D19";

interface MintProgressBarsProps {
  refreshInterval?: number; // in milliseconds
}

export default function MintProgressBars({ refreshInterval = 15000 }: MintProgressBarsProps) {
  // State variables
  const [guaranteedMax, setGuaranteedMax] = useState<number>(5712); // Default from the prompt
  const [guaranteedMinted, setGuaranteedMinted] = useState<number>(0);
  const [totalMax, setTotalMax] = useState<number>(0);
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [totalRaffleEntries, setTotalRaffleEntries] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize provider and contract
  useEffect(() => {
    try {
      // Initialize ethers provider with AnimeChain RPC URL
      const rpcUrl = process.env.NEXT_PUBLIC_ANIME_MAINNET_RPC_URL || "https://rpc-animechain-39xf6m45e3.t.conduit.xyz";
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      setProvider(provider);
      
      // Initialize contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      setContract(contract);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error initializing contract: ${errorMessage}`);
      setIsLoading(false);
    }
  }, []);

  // Safely convert to number regardless of whether the result is already a number or BigNumber
  const safeToNumber = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val.toNumber === 'function') return val.toNumber();
    return Number(val.toString());
  };

  // Fetch data from the contract
  const fetchMintData = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all stats in parallel
      const [guaranteedMaxRes, guaranteedMintedRes, totalMaxRes, totalMintedRes, unusedRaffleEntriesRes] = await Promise.all([
        contract.guaranteedTotalMax(),
        contract.guaranteedTotalMinted(),
        contract.totalNFTMax(),
        contract.totalNFTMinted(),
        contract.getUnusedRaffleEntries()
      ]);

      // Calculate total raffle entries - they come as two arrays: addresses and amounts
      // We need to sum all the amounts in the second array
      let raffleEntriesCount = 0;
      
      if (Array.isArray(unusedRaffleEntriesRes) && unusedRaffleEntriesRes.length >= 2 && Array.isArray(unusedRaffleEntriesRes[1])) {
        // Sum up all raffle entry amounts
        raffleEntriesCount = unusedRaffleEntriesRes[1].reduce((sum, amount) => {
          return sum + safeToNumber(amount);
        }, 0);
      } else if (unusedRaffleEntriesRes && unusedRaffleEntriesRes[1]) {
        // Handle case where it might be returned as tuple rather than array
        const amountsArray = unusedRaffleEntriesRes[1];
        if (Array.isArray(amountsArray)) {
          raffleEntriesCount = amountsArray.reduce((sum, amount) => {
            return sum + safeToNumber(amount);
          }, 0);
        }
      }
      
      // Update state with results, safely handling different return types
      setGuaranteedMax(safeToNumber(guaranteedMaxRes));
      setGuaranteedMinted(safeToNumber(guaranteedMintedRes));
      setTotalMax(safeToNumber(totalMaxRes));
      setTotalMinted(safeToNumber(totalMintedRes));
      setTotalRaffleEntries(raffleEntriesCount);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching mint data:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching mint data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentages
  const guaranteedProgress = guaranteedMax > 0 ? (guaranteedMinted / guaranteedMax) * 100 : 0;
  
  // Calculate total progress, ensuring we don't exceed 100% for visualization
  const totalMintedPercent = totalMax > 0 ? (totalMinted / totalMax) * 100 : 0;
  
  // Calculate raffle percentage - this is the additional percentage on top of already minted
  const totalWithRaffleMax = Math.min(totalMinted + totalRaffleEntries, totalMax);
  const raffleEntriesPercent = totalMax > 0 ? ((totalWithRaffleMax - totalMinted) / totalMax) * 100 : 0;
  
  // Combined percentage to show potential fill if all raffles are minted (capped at 100%)
  const combinedPercent = Math.min(totalMintedPercent + raffleEntriesPercent, 100);

  // Format percentages to 2 decimal places
  const formatPercent = (percent: number) => {
    return percent.toFixed(2);
  };

  // Determine progress bar color class and animation
  const getProgressBarClasses = (percent: number) => {
    let baseClasses = "h-4 rounded-full transition-all duration-500";
    
    // Add gradient colors based on progress
    if (percent >= 95) {
      baseClasses += " bg-gradient-to-r from-green-600 to-green-400 animate-pulse";
    } else if (percent >= 75) {
      baseClasses += " bg-gradient-to-r from-blue-600 to-green-400";
    } else if (percent >= 50) {
      baseClasses += " bg-gradient-to-r from-blue-600 to-blue-400";
    } else if (percent >= 25) {
      baseClasses += " bg-gradient-to-r from-indigo-600 to-blue-400";
    } else {
      baseClasses += " bg-gradient-to-r from-purple-600 to-indigo-400";
    }
    
    return baseClasses;
  };

  // Fetch data on component mount and set up interval
  useEffect(() => {
    if (contract) {
      // Initial fetch
      fetchMintData();
      
      // Set up interval for periodic updates
      const intervalId = setInterval(fetchMintData, refreshInterval);
      
      // Clean up on unmount
      return () => clearInterval(intervalId);
    }
  }, [contract, refreshInterval]);

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AnimeChain NFT Mint Progress</h2>
        <button 
          onClick={fetchMintData}
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
      
      {isLoading && !lastUpdated && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="space-y-8">
        {/* Guaranteed Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium">
              Reserved NFTs 
              {guaranteedProgress >= 95 && 
                <span className="ml-2 text-xs px-2 py-0.5 bg-green-800 text-green-200 rounded-full">Almost Complete!</span>
              }
            </h3>
            <span className="text-sm font-mono">{guaranteedMinted} / {guaranteedMax} ({formatPercent(guaranteedProgress)}%)</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-4 shadow-inner">
            <div 
              className={getProgressBarClasses(guaranteedProgress)}
              style={{ width: `${Math.min(guaranteedProgress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Total NFT Progress Bar with Raffle Entries */}
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium">
              Total NFTs
              {totalMintedPercent >= 95 && 
                <span className="ml-2 text-xs px-2 py-0.5 bg-green-800 text-green-200 rounded-full">Almost Complete!</span>
              }
            </h3>
            <div className="text-right">
              <div className="text-sm font-mono">
                {totalMinted} / {totalMax} ({formatPercent(totalMintedPercent)}%)
              </div>
              <div className="text-xs text-amber-300 font-mono">
                + {totalRaffleEntries} raffle entries ({formatPercent(raffleEntriesPercent)}%)
              </div>
            </div>
          </div>
          
          {/* Stacked progress bar showing both minted and potential raffle allocations */}
          <div className="w-full bg-slate-700/60 rounded-full h-4 shadow-inner overflow-hidden">
            {/* Base layer - already minted tokens */}
            <div className="relative h-4 rounded-full overflow-hidden">
              {/* Already minted tokens */}
              <div 
                className={getProgressBarClasses(totalMintedPercent)}
                style={{ width: `${Math.min(totalMintedPercent, 100)}%` }}
              ></div>
              
              {/* Potential raffle tokens layer */}
              {raffleEntriesPercent > 0 && (
                <div 
                  className="absolute top-0 h-4 bg-amber-500/70 border-l border-amber-400"
                  style={{ 
                    left: `${Math.min(totalMintedPercent, 100)}%`,
                    width: `${Math.min(raffleEntriesPercent, 100 - totalMintedPercent)}%` 
                  }}
                ></div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          
          {/* Legend explaining the colors */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 mr-2"></div>
              <span className="text-xs">Minted</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500/70 mr-2"></div>
              <span className="text-xs">Raffle Entries</span>
            </div>
          </div>
          
          {/* Warning if approaching or exceeding total allocation */}
          {(totalMintedPercent + raffleEntriesPercent) > 95 && (
            <div className="mt-3 p-2 bg-amber-900/30 border border-amber-800 rounded-md text-amber-200 text-xs">
              Note: Total of minted NFTs plus raffle entries is approaching the maximum allocation. 
              {(totalMintedPercent + raffleEntriesPercent) > 100 && 
                " Not all raffle entries will be able to be fulfilled."}
            </div>
          )}
        </div>
      </div>
      
      {lastUpdated && (
        <div className="mt-6 text-right text-sm text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm">
        <p className="mb-2">Contract Information:</p>
        <p className="font-mono text-xs break-all">
          Address: {CONTRACT_ADDRESS}
        </p>
        <a 
          href={`https://explorer-animechain-39xf6m45e3.t.conduit.xyz/address/${CONTRACT_ADDRESS}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
        >
          View on AnimeChain Explorer
        </a>
      </div>
    </div>
  );
} 