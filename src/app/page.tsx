"use client";

import { Web3Provider, useWeb3 } from "./components/Web3Provider";
import EventCard from "./components/EventCard";
import ConfigViewer from "./components/ConfigViewer";
import JsonRpcInterface from "./components/JsonRpcInterface";
import BlockchainStats from "./components/BlockchainStats";
import BridgeInterface from "./components/BridgeInterface";
import ERC20DepositInterface from "./components/ERC20DepositInterface";
import MintProgressBars from "./components/MintProgressBars";
import NFTTokenManager from "./components/NFTTokenManager";
import AdvancedOptions from "./components/AdvancedOptions";
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

  const [activeTab, setActiveTab] = useState<'bridge' | 'events' | 'config' | 'jsonrpc' | 'stats' | 'mint'>('bridge');
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
              <button
                onClick={() => {
                  setShowAdvancedOptions(true);
                  setActiveTab('mint');
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-sm"
              >
                NFT Mint Progress
              </button>
              
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
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'mint' 
                  ? 'border-green-500 text-green-500' 
                  : 'border-transparent hover:border-green-500 hover:text-green-400 text-green-300'
              }`}
              onClick={() => setActiveTab('mint')}
            >
              NFT Mint Progress
            </button>
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
        
        {/* Mint Progress Tab */}
        {showAdvancedOptions && activeTab === 'mint' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">AnimeChain NFT Mint Progress</h2>
              <p className="text-gray-300">Live tracking of the TCG Booster Box NFT minting</p>
            </div>
            
            {/* Hero banner */}
            <div className="relative mb-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900 z-10"></div>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
              <div className="h-40 relative z-20">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-4">
                    <h2 className="text-2xl font-bold text-white mb-3">TCG Booster Box NFT</h2>
                    <p className="text-gray-200 max-w-2xl">Mint progress tracker for contract <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">0x0CA9229a48a154C62F8398e52a8fE082E9587D19</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Two-column layout for Progress + Token Management */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MintProgressBars refreshInterval={15000} /> {/* Refresh every 15 seconds */}
              <NFTTokenManager />
            </section>
            
            {/* Note about Azuki team reservations */}
            <div className="p-4 bg-amber-900/30 border border-amber-800 rounded-md text-amber-200 text-sm mb-8">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium mb-1">Note about Total Allocation</p>
                  <p>There is a section NOT accounted for in the progress bars above, as the Azuki team is reserving some alpha packs for giveaways.</p>
                </div>
              </div>
            </div>
            
            {/* Advanced Options section with MetaMask button */}
            <section className="mb-8">
              <AdvancedOptions />
            </section>
            
            <section className="p-6 bg-slate-800 rounded-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">About This Mint</h2>
              </div>
              
              <p className="mb-4">
                This page tracks the progress of the TCG Booster Box NFT mint on AnimeChain. The mint includes
                two categories of NFTs:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><span className="font-medium">Reserved NFTs</span>: These are guaranteed NFTs allocated to specific addresses (maximum: 5,712).</li>
                <li><span className="font-medium">Total NFTs</span>: The total number of NFTs available in this mint, including both reserved and public allocation.</li>
              </ul>
              
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm">
                <h3 className="font-medium mb-2">Mint Details:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Each NFT represents a digital TCG Booster Box.</li>
                  <li>The smart contract validates authorizations via cryptographic signatures.</li>
                  <li>Reserved allocations are tracked per wallet and enforced by the contract.</li>
                  <li>The contract ensures transparent and fair distribution according to preset limits.</li>
                  <li>The mint is permanent - once minted, these NFTs cannot be replicated or increased in supply.</li>
                </ul>
              </div>
            </section>
            
            <section className="p-6 bg-slate-800 rounded-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Contract Details</h2>
              </div>
              <div className="md:flex md:space-x-4">
                <div className="p-4 bg-slate-700/30 rounded-lg text-sm md:flex-1 mb-4 md:mb-0">
                  <h3 className="mb-2 font-medium">Contract Information:</h3>
                  <div className="space-y-2">
                    <p className="font-mono text-xs break-all">
                      <span className="text-gray-300">Minting Contract:</span> 0x0CA9229a48a154C62F8398e52a8fE082E9587D19
                    </p>
                    <p className="font-mono text-xs break-all">
                      <span className="text-gray-300">NFT Token Contract:</span> 0xc27cE0A37721db61375AF30c5b2D9Ca107f73264
                    </p>
                    <p>
                      <span className="text-gray-300">Network:</span> AnimeChain
                    </p>
                    <p>
                      <span className="text-gray-300">Contract Type:</span> ERC-1155 NFT
                    </p>
                    <p>
                      <a 
                        href="https://explorer-animechain-39xf6m45e3.t.conduit.xyz/address/0x0CA9229a48a154C62F8398e52a8fE082E9587D19"
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                      >
                        <span>View Mint Contract on Explorer</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-700/30 rounded-lg text-sm md:flex-1">
                  <h3 className="mb-2 font-medium">Current Mint Status:</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-300">Mint Window:</span> Open
                    </p>
                    <p>
                      <span className="text-gray-300">Mint Method:</span> Signature-based authorization
                    </p>
                    <p>
                      <span className="text-gray-300">Automatic Refresh:</span> Every 15 seconds
                    </p>
                    <p>
                      <span className="text-gray-300">Data Source:</span> Direct contract interaction
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
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
