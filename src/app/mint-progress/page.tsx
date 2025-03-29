"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import MintProgressBars from '../components/MintProgressBars';
import NFTTokenManager from '../components/NFTTokenManager';
import AdvancedOptions from '../components/AdvancedOptions';
import { config } from '../config';

export default function MintProgressPage() {
  // Track if more info is shown
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">AnimeChain NFT Mint Progress</h1>
            <p className="text-gray-300 mb-4">Live tracking of the TCG Booster Box NFT minting</p>
          </div>
          
          <Link 
            href="/"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero banner - using gradients instead of external image */}
      <div className="relative mb-8 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900 z-10"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
        <div className="h-48 relative z-20">
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <h2 className="text-2xl font-bold text-white mb-3">TCG Booster Box NFT</h2>
              <p className="text-gray-200 max-w-2xl">Mint progress tracker for contract <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">0x0CA9229a48a154C62F8398e52a8fE082E9587D19</span></p>
            </div>
          </div>
        </div>
      </div>

      <main>
        {/* Two-column layout for Progress + Token Management */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MintProgressBars refreshInterval={15000} /> {/* Refresh every 15 seconds */}
          <NFTTokenManager />
        </section>
        
        {/* Advanced Options section with MetaMask button */}
        <section className="mb-8">
          <AdvancedOptions />
        </section>
        
        <section className="p-6 bg-slate-800 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">About This Mint</h2>
            <button 
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
            >
              {showMoreInfo ? 'Show Less' : 'Show More Info'}
            </button>
          </div>
          
          <p className="mb-4">
            This page tracks the progress of the TCG Booster Box NFT mint on AnimeChain. The mint includes
            two categories of NFTs:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><span className="font-medium">Reserved NFTs</span>: These are guaranteed NFTs allocated to specific addresses (maximum: 5,712).</li>
            <li><span className="font-medium">Total NFTs</span>: The total number of NFTs available in this mint, including both reserved and public allocation.</li>
          </ul>
          
          {showMoreInfo && (
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg text-sm animate-fadeIn">
              <h3 className="font-medium mb-2">Mint Details:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Each NFT represents a digital TCG Booster Box.</li>
                <li>The smart contract validates authorizations via cryptographic signatures.</li>
                <li>Reserved allocations are tracked per wallet and enforced by the contract.</li>
                <li>The contract ensures transparent and fair distribution according to preset limits.</li>
                <li>The mint is permanent - once minted, these NFTs cannot be replicated or increased in supply.</li>
              </ul>
            </div>
          )}
        </section>
        
        <section className="p-6 bg-slate-800 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
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
                <p>
                  <a 
                    href="https://explorer-animechain-39xf6m45e3.t.conduit.xyz/token/0xc27cE0A37721db61375AF30c5b2D9Ca107f73264?tab=read_write_contract"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                  >
                    <span>View NFT Token on Explorer</span>
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
      </main>
      
      <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-sm text-gray-400">
        <p>AnimeChain NFT Mint Progress • Official Status Page</p>
        <p className="mt-2">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return to Main Bridge Page
          </Link>
        </p>
      </footer>
      
      {/* Add global CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 