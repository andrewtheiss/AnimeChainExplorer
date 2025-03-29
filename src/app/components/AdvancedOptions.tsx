"use client";

import React, { useState } from 'react';
import AddToMetaMaskButton from './AddToMetaMaskButton';

export default function AdvancedOptions() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Advanced Options</h2>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
        >
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
      </div>
      
      {!showAdvanced && (
        <p className="text-sm text-gray-400">
          Advanced options allow you to add the NFT token directly to MetaMask for easier management.
        </p>
      )}
      
      {showAdvanced && (
        <div className="animate-fadeIn">
          <AddToMetaMaskButton />
        </div>
      )}
    </div>
  );
} 