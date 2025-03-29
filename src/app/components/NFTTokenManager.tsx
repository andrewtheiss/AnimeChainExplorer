"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// NFT metadata and addresses
const NFT_DATA = {
  tokenAddress: '0xc27cE0A37721db61375AF30c5b2D9Ca107f73264',
  tokenId: '1',
  tokenSymbol: 'ANIMETCG',
  tokenName: 'Anime TCG Booster Box',
  explorerUrl: 'https://explorer-animechain-39xf6m45e3.t.conduit.xyz/token/0xc27cE0A37721db61375AF30c5b2D9Ca107f73264?tab=read_write_contract',
};

// ERC-1155 ABI for balanceOf and safeTransferFrom functions
const TOKEN_ABI = [
  {
    "inputs": [{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],
    "name": "balanceOf",
    "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function NFTTokenManager() {
  const [account, setAccount] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Connect to wallet and initialize contract
  const connectWallet = async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      
      // Check if MetaMask is installed
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error('MetaMask is not installed. Please install MetaMask first.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);
      
      // Create ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      
      // Create contract instance
      const signer = provider.getSigner();
      const contract = new ethers.Contract(NFT_DATA.tokenAddress, TOKEN_ABI, signer);
      setContract(contract);
      
      setIsConnected(true);
      setStatus('success');
      
      // Query token balance
      await refreshBalance(contract, account);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  // Refresh token balance
  const refreshBalance = async (contractInstance: ethers.Contract | null = null, accountAddress: string | null = null) => {
    try {
      const contractToUse = contractInstance || contract;
      const accountToUse = accountAddress || account;
      
      if (!contractToUse || !accountToUse) return;
      
      setStatus('loading');
      const balance = await contractToUse.balanceOf(accountToUse, NFT_DATA.tokenId);
      setTokenBalance(balance.toNumber());
      setStatus('idle');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch token balance');
    }
  };
  
  // Send token to recipient
  const sendToken = async () => {
    if (!contract || !account || !recipient || tokenBalance < 1) return;
    
    try {
      setStatus('loading');
      setErrorMessage(null);
      
      // Validate recipient address
      if (!ethers.utils.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }
      
      // Send token using safeTransferFrom
      const tx = await contract.safeTransferFrom(
        account,
        recipient,
        NFT_DATA.tokenId,
        1, // Amount to send
        '0x' // No data
      );
      
      // Wait for transaction to complete
      await tx.wait();
      
      // Refresh balance
      await refreshBalance();
      
      setStatus('success');
      setRecipient('');
    } catch (error) {
      console.error('Error sending token:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send token');
    }
  };
  
  // Handle account changes (e.g., user switches accounts in MetaMask)
  useEffect(() => {
    const ethereum = window.ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected all accounts
          setAccount(null);
          setIsConnected(false);
          setTokenBalance(0);
        } else {
          // User switched to a different account
          setAccount(accounts[0]);
          if (contract) {
            refreshBalance(contract, accounts[0]);
          }
        }
      };
      
      ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [contract]);
  
  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Manage Your NFT</h2>
      
      {/* Connection Status */}
      {!isConnected ? (
        <div className="mb-4">
          <button
            onClick={connectWallet}
            disabled={status === 'loading'}
            className={`
              w-full inline-flex justify-center items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors
              ${status === 'loading' ? 'bg-gray-600 cursor-wait' : 
                status === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Connect Wallet to Check NFT Balance
              </>
            )}
          </button>
          
          {errorMessage && (
            <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
          )}
        </div>
      ) : (
        <>
          {/* Wallet & Balance Info */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
            {/* Account Info */}
            <div className="p-3 bg-slate-700/30 rounded-md flex-1">
              <p className="text-sm text-gray-300 mb-1">Connected Account</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs truncate max-w-[200px]">{account?.substring(0, 8)}...{account?.substring(account.length - 6)}</p>
                <button
                  onClick={() => refreshBalance()}
                  className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {/* Token Balance */}
            <div className="p-3 bg-slate-700/30 rounded-md flex-1 text-center">
              <p className="text-sm text-gray-300 mb-1">Your NFT Balance</p>
              <p className="text-2xl font-bold">{tokenBalance}</p>
            </div>
          </div>
          
          {/* Send Token Form */}
          {tokenBalance > 0 && (
            <div className="mb-4">
              <div className="p-4 bg-blue-900/30 border border-blue-800 rounded-md mb-4">
                <h3 className="text-sm font-medium mb-2">Send NFT to Address</h3>
                <div className="flex">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={status === 'loading'}
                  />
                  <button
                    onClick={sendToken}
                    disabled={status === 'loading' || !recipient || tokenBalance < 1}
                    className={`
                      px-4 py-2 rounded-r-md text-sm font-medium transition-colors
                      ${status === 'loading' ? 'bg-gray-600 cursor-wait' : 
                        !recipient || tokenBalance < 1 ? 'bg-gray-600 cursor-not-allowed' : 
                        'bg-blue-600 hover:bg-blue-700'}
                    `}
                  >
                    {status === 'loading' ? 'Sending...' : 'Send 1 NFT'}
                  </button>
                </div>
                {status === 'success' && (
                  <p className="mt-2 text-sm text-green-400">Token sent successfully!</p>
                )}
                {errorMessage && (
                  <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
                )}
              </div>
            </div>
          )}
          
          {tokenBalance === 0 && (
            <div className="text-center p-4 bg-slate-700/30 rounded-md">
              <p>You don't have any NFTs in your wallet.</p>
            </div>
          )}
          
          {/* Explorer Link */}
          <div className="mt-4 text-center">
            <a 
              href={NFT_DATA.explorerUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
            >
              <span>View Token on AnimeChain Explorer</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
} 