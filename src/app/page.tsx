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

// Main content component that uses the Web3 context
function MainContent() {
  const { 
    isConnected, 
    events, 
    error, 
    connect, 
    disconnect, 
    contractAddress, 
    websocketUrl 
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<'events' | 'config' | 'jsonrpc' | 'stats' | 'bridge' | 'token-deposit'>('stats');

  // Open contract address in block explorer
  const openContractExplorer = () => {
    window.open(`https://explorer-animechain-39xf6m45e3.t.conduit.xyz/address/${contractAddress}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AnimeChain Explorer</h1>
        <p className="text-gray-300 mb-4">Monitor events from the EntryPoint contract at {contractAddress}</p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          {isConnected ? (
            <button 
              onClick={disconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={connect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Connect to AnimeChain
            </button>
          )}
          
          <button 
            onClick={openContractExplorer}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            View Contract Info
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 mb-4">
            {error}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <div className="flex flex-wrap -mb-px">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'events' 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
            }`}
            onClick={() => setActiveTab('events')}
          >
            Contract Events
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
              activeTab === 'token-deposit' 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent hover:border-slate-500 hover:text-slate-400 text-slate-300'
            }`}
            onClick={() => setActiveTab('token-deposit')}
          >
            Token Deposit
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
        </div>
      </div>

      <main>
        {/* Events Tab */}
        {activeTab === 'events' && (
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

        {/* JSON-RPC Tab */}
        {activeTab === 'jsonrpc' && (
          <JsonRpcInterface defaultRpcUrl={config.animeChain.mainnet.rpcUrl} />
        )}

        {/* Blockchain Stats Tab */}
        {activeTab === 'stats' && (
          <BlockchainStats refreshInterval={30000} />
        )}

        {/* Bridge Tab */}
        {activeTab === 'bridge' && (
          <BridgeInterface />
        )}

        {/* Token Deposit Tab */}
        {activeTab === 'token-deposit' && (
          <ERC20DepositInterface />
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <ConfigViewer />
        )}
      </main>
      
      <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-gray-400">
        <p>AnimeChain Explorer • WebSocket URL: {websocketUrl}</p>
        <p className="mt-2">Contract Address: {contractAddress}</p>
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
