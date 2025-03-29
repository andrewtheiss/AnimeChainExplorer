"use client";

import { Web3Provider, useWeb3 } from "./components/Web3Provider";
import EventCard from "./components/EventCard";
import ConfigViewer from "./components/ConfigViewer";
import JsonRpcInterface from "./components/JsonRpcInterface";
import BlockchainStats from "./components/BlockchainStats";
import BridgeInterface from "./components/BridgeInterface";
import ERC20DepositInterface from "./components/ERC20DepositInterface";
import { useState } from "react";
import { config } from "./config";
import Link from "next/link";

// Main content component that uses the Web3 context
function MainContent() {
  const { 
    isConnected, 
    events, 
    error, 
    connect, 
    disconnect, 
    contractAddress, 
    websocketUrl,
    account
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<'bridge' | 'events' | 'config' | 'jsonrpc' | 'stats'>('bridge');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // AnimeChain explorer URL
  const ANIMECHAIN_EXPLORER_URL = 'https://explorer-animechain-39xf6m45e3.t.conduit.xyz';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">AnimeChain Bridge</h1>
            <p className="text-gray-300 mb-4">Transfer your ANIME tokens from Arbitrum to AnimeChain</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-2">
              <Link
                href="/mint-progress"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-sm"
              >
                NFT Mint Progress
              </Link>
              
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm"
              >
                {showAdvancedOptions ? "Hide Advanced Options" : "Show Advanced Options"}
              </button>
            </div>
          </div>
        </div>
        
        {isConnected && account && (
          <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-md text-blue-200 mb-4">
            <p className="font-medium">Connected to AnimeChain</p>
            <p className="text-sm text-blue-300 mb-2">Account: <span className="font-mono">{account}</span></p>
            <a
              href={`${ANIMECHAIN_EXPLORER_URL}/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm inline-flex items-center"
            >
              <span>View your account on AnimeChain Explorer</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 mb-4">
            {error}
          </div>
        )}
      </header>

      {/* Show tabs only if advanced options is enabled */}
      {showAdvancedOptions && (
        <div className="border-b border-slate-700 mb-6">
          <div className="flex flex-wrap -mb-px">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'bridge' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
              }`}
              onClick={() => setActiveTab('bridge')}
            >
              Bridge
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'events' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
              }`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'jsonrpc' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
              }`}
              onClick={() => setActiveTab('jsonrpc')}
            >
              JSON-RPC
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'stats' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              Blockchain Stats
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'config' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
              }`}
              onClick={() => setActiveTab('config')}
            >
              Configuration
            </button>
            <Link
              href="/mint-progress"
              className="py-2 px-4 border-b-2 font-medium text-sm border-transparent hover:border-green-500 hover:text-green-400 text-green-300"
            >
              NFT Mint Progress
            </Link>
          </div>
        </div>
      )}

      <main>
        {/* Always show Bridge if not in advanced options mode or if bridge tab is selected */}
        {(!showAdvancedOptions || activeTab === 'bridge') && (
          <BridgeInterface />
        )}

        {/* Only show other tabs if advanced options is enabled */}
        {showAdvancedOptions && activeTab === 'events' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Contract Events</h2>
            {events.length === 0 ? (
              <div className="p-6 bg-slate-700/30 rounded-lg text-center">
                {isConnected ? 'Waiting for events...' : 'Connect to start monitoring events'}
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))}
              </div>
            )}
          </>
        )}

        {showAdvancedOptions && activeTab === 'jsonrpc' && (
          <JsonRpcInterface defaultRpcUrl={config.animeChain.mainnet.rpcUrl} />
        )}

        {showAdvancedOptions && activeTab === 'stats' && (
          <BlockchainStats refreshInterval={30000} />
        )}

        {showAdvancedOptions && activeTab === 'config' && (
          <ConfigViewer />
        )}
      </main>
      
      <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-gray-400">
        <p>AnimeChain Bridge • Official Bridge from Arbitrum to AnimeChain</p>
        {isConnected && account && (
          <p className="mt-2">
            <a
              href={`${ANIMECHAIN_EXPLORER_URL}/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Your AnimeChain Account
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}

// Main Home component that wraps everything with the Web3Provider
export default function Home() {
  return (
    <Web3Provider>
      <MainContent />
    </Web3Provider>
  );
}
