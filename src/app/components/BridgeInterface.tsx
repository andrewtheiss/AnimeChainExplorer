"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Define the Ethereum window interface
interface EthereumWindow extends Window {
  ethereum?: any;
}

// Bridge contract ABI (just the createRetryableTicket function we need)
const BRIDGE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "l2CallValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxSubmissionCost",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "excessFeeRefundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "callValueRefundAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxFeePerGas",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "tokenTotalFeeAmount",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "createRetryableTicket",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Constants for the bridge
const BRIDGE_CONTRACT_ADDRESS = '0xA203252940839c8482dD4b938b4178f842E343D7';
const DEFAULT_TO_ADDRESS = '0x5f0aBD2b1988640C45efa24d09947290C98172cf';
const DEFAULT_DATA = ethers.utils.toUtf8Bytes('superbridge');

// Successful transaction parameter values
const DEFAULT_MAX_SUBMISSION_COST = '10392480000000';
const DEFAULT_GAS_LIMIT = '300000';
const DEFAULT_MAX_FEE_PER_GAS = '60000000';

export default function BridgeInterface() {
  // State variables
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [bridgeContract, setBridgeContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isArbitrumNetwork, setIsArbitrumNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    to: DEFAULT_TO_ADDRESS,
    l2CallValue: ethers.utils.parseEther('0.01').toString(), // Default to 0.01 ETH instead of 1 ETH
    maxSubmissionCost: DEFAULT_MAX_SUBMISSION_COST,
    excessFeeRefundAddress: DEFAULT_TO_ADDRESS,
    callValueRefundAddress: DEFAULT_TO_ADDRESS,
    gasLimit: DEFAULT_GAS_LIMIT,
    maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
    data: 'superbridge',
    // Add a new field for transaction-level gas limit
    txGasLimit: '10000000'
  });

  // Calculate the token total fee amount (l2CallValue + maxSubmissionCost)
  const calculateTokenTotalFeeAmount = () => {
    try {
      const l2CallValue = ethers.BigNumber.from(formData.l2CallValue);
      const maxSubmissionCost = ethers.BigNumber.from(formData.maxSubmissionCost);
      return l2CallValue.add(maxSubmissionCost).toString();
    } catch (err) {
      console.error('Error calculating token total fee:', err);
      return '0';
    }
  };

  // Update form addresses with connected wallet
  const updateFormAddresses = (walletAddress: string) => {
    setFormData(prev => ({
      ...prev,
      to: walletAddress,
      excessFeeRefundAddress: walletAddress,
      callValueRefundAddress: walletAddress
    }));
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    setError(null);
    setDebugInfo(null);
    
    // Get the ethereum object from window, using type assertion
    const ethereum = (window as unknown as EthereumWindow).ethereum;
    
    if (!ethereum) {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Create provider
      const provider = new ethers.providers.Web3Provider(ethereum);
      const network = await provider.getNetwork();
      
      // Check if connected to Arbitrum network (chainId 42161)
      const isArbitrum = network.chainId === 42161;
      setIsArbitrumNetwork(isArbitrum);
      
      if (!isArbitrum) {
        // Prompt user to switch to Arbitrum
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xA4B1' }], // 0xA4B1 is hex for 42161
          });
          // Refresh provider after network switch
          const updatedProvider = new ethers.providers.Web3Provider(ethereum);
          const updatedNetwork = await updatedProvider.getNetwork();
          setIsArbitrumNetwork(updatedNetwork.chainId === 42161);
          setProvider(updatedProvider);
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xA4B1',
                  chainName: 'Arbitrum One',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                  blockExplorerUrls: ['https://arbiscan.io/']
                }],
              });
              // Try connecting again after adding network
              connectWallet();
              return;
            } catch (addError) {
              setError('Failed to add Arbitrum network to MetaMask');
              console.error('Error adding Arbitrum network:', addError);
            }
          } else {
            setError('Failed to switch to Arbitrum network');
            console.error('Error switching to Arbitrum network:', switchError);
          }
        }
      } else {
        setProvider(provider);
      }
      
      const signer = provider.getSigner();
      setSigner(signer);
      
      // Create contract instance
      const contract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, BRIDGE_ABI, signer);
      setBridgeContract(contract);
      
      setAccount(account);
      setIsConnected(true);
      setError(null);
      
      // Automatically update form addresses with the connected wallet address
      updateFormAddresses(account);
      
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(`Failed to connect wallet: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from MetaMask
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBridgeContract(null);
    setIsConnected(false);
    setIsArbitrumNetwork(false);
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    
    // Reset form addresses to defaults
    setFormData(prev => ({
      ...prev,
      to: DEFAULT_TO_ADDRESS,
      excessFeeRefundAddress: DEFAULT_TO_ADDRESS,
      callValueRefundAddress: DEFAULT_TO_ADDRESS
    }));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle bridge transaction
  const handleBridgeTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    
    if (!bridgeContract || !signer) {
      setError('Wallet not connected or bridge contract not initialized');
      return;
    }
    
    if (!isArbitrumNetwork) {
      setError('Please connect to Arbitrum network');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert data to bytes
      const dataBytes = ethers.utils.toUtf8Bytes(formData.data);
      
      // Calculate token total fee amount
      const tokenTotalFeeAmount = calculateTokenTotalFeeAmount();
      
      // Display debug info before sending transaction
      setDebugInfo(JSON.stringify({
        params: {
          to: formData.to,
          l2CallValue: formData.l2CallValue,
          l2CallValueReadable: ethers.utils.formatEther(formData.l2CallValue) + ' ETH',
          maxSubmissionCost: formData.maxSubmissionCost,
          excessFeeRefundAddress: formData.excessFeeRefundAddress,
          callValueRefundAddress: formData.callValueRefundAddress,
          gasLimit: formData.gasLimit,
          maxFeePerGas: formData.maxFeePerGas,
          tokenTotalFeeAmount: tokenTotalFeeAmount,
          tokenTotalFeeAmountReadable: ethers.utils.formatEther(tokenTotalFeeAmount) + ' ETH',
          data: formData.data,
          txGasLimit: formData.txGasLimit
        }
      }, null, 2));
      
      // Call the bridge contract with explicit gas limit
      const tx = await bridgeContract.createRetryableTicket(
        formData.to,
        formData.l2CallValue,
        formData.maxSubmissionCost,
        formData.excessFeeRefundAddress,
        formData.callValueRefundAddress,
        formData.gasLimit,
        formData.maxFeePerGas,
        tokenTotalFeeAmount,
        dataBytes,
        {
          value: tokenTotalFeeAmount, // Send ETH with the transaction
          gasLimit: ethers.BigNumber.from(formData.txGasLimit) // Use custom gas limit
        }
      );
      
      setDebugInfo(prev => 
        prev + '\n\nTransaction sent! Hash: ' + tx.hash + 
        '\nWaiting for confirmation...'
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw {
          message: 'Transaction reverted on-chain',
          receipt: receipt,
          code: 'CALL_EXCEPTION'
        };
      }
      
      setTxHash(tx.hash);
      setDebugInfo(prev => prev + '\n\nTransaction success! Receipt: ' + JSON.stringify(receipt, null, 2));
    } catch (err: any) {
      console.error('Error creating bridge transaction:', err);
      let errorMessage = `Failed to create bridge transaction: ${err.message || 'Unknown error'}`;
      
      // Enhanced error debugging
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction simulation failed. This could be due to insufficient funds or invalid parameters.';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed on-chain. The bridge contract rejected the transaction.';
        
        // Provide more specific guidance
        errorMessage += '\n\nPossible causes:\n' +
          '- Insufficient balance for fees\n' +
          '- Invalid parameters for the bridge contract\n' +
          '- Try using the exact parameters from the example transaction';
      }
      
      setError(errorMessage);
      setDebugInfo(prev => prev + '\n\nTransaction error: ' + JSON.stringify({
        error: err.message,
        code: err.code,
        details: err.data ? err.data.message : 'No additional details',
        receipt: err.receipt ? JSON.stringify(err.receipt, null, 2) : 'No receipt'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    const ethereum = (window as unknown as EthereumWindow).ethereum;
    
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== account) {
          // Account changed, update state
          setAccount(accounts[0]);
          // Update form addresses with new account
          updateFormAddresses(accounts[0]);
        }
      };
      
      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };
      
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup listeners on unmount
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Arbitrum Bridge Interface</h2>
      
      <div className="mb-6">
        {isConnected ? (
          <div className="flex justify-between items-center bg-slate-700/30 p-4 rounded-lg mb-4">
            <div>
              <p className="text-sm text-gray-300">Connected Account:</p>
              <p className="font-mono text-sm">{account}</p>
              <p className="text-sm mt-1">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isArbitrumNetwork ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {isArbitrumNetwork ? 'Connected to Arbitrum' : 'Not connected to Arbitrum'}
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm"
              disabled={isLoading}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect to Arbitrum via MetaMask'}
          </button>
        )}
        
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 mb-4">
            {error}
          </div>
        )}
        
        {txHash && (
          <div className="p-3 bg-green-900/50 border border-green-700 rounded-md text-green-200 mb-4">
            <p>Bridge transaction successful!</p>
            <a
              href={`https://arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
            >
              View on Arbiscan: {txHash}
            </a>
          </div>
        )}
      </div>
      
      <form onSubmit={handleBridgeTransaction} className="space-y-4">
        {isConnected && (
          <div className="bg-slate-700/30 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-300 mb-2">
              Having issues with the bridge? Try using the example transaction values that are known to work:
            </p>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  to: DEFAULT_TO_ADDRESS,
                  l2CallValue: ethers.utils.parseEther('0.01').toString(),
                  maxSubmissionCost: DEFAULT_MAX_SUBMISSION_COST,
                  excessFeeRefundAddress: account || DEFAULT_TO_ADDRESS,
                  callValueRefundAddress: account || DEFAULT_TO_ADDRESS,
                  gasLimit: DEFAULT_GAS_LIMIT,
                  maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
                  data: 'superbridge',
                  txGasLimit: '10000000'
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm"
            >
              Use Example Values
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Destination Address (to)
            </label>
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="0x..."
              required
            />
            {isConnected && (
              <p className="text-xs text-gray-400 mt-1">Using your connected wallet address</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              L2 Call Value (ETH)
            </label>
            <input
              type="text"
              name="l2CallValue"
              value={formData.l2CallValue}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Amount in wei"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Default: 0.01 ETH in wei</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Max Submission Cost
            </label>
            <input
              type="text"
              name="maxSubmissionCost"
              value={formData.maxSubmissionCost}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Cost in wei"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Excess Fee Refund Address
            </label>
            <input
              type="text"
              name="excessFeeRefundAddress"
              value={formData.excessFeeRefundAddress}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="0x..."
              required
            />
            {isConnected && (
              <p className="text-xs text-gray-400 mt-1">Using your connected wallet address</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Call Value Refund Address
            </label>
            <input
              type="text"
              name="callValueRefundAddress"
              value={formData.callValueRefundAddress}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="0x..."
              required
            />
            {isConnected && (
              <p className="text-xs text-gray-400 mt-1">Using your connected wallet address</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Gas Limit
            </label>
            <input
              type="text"
              name="gasLimit"
              value={formData.gasLimit}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Gas limit in wei"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Increased to avoid estimation issues</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Max Fee Per Gas
            </label>
            <input
              type="text"
              name="maxFeePerGas"
              value={formData.maxFeePerGas}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Fee in wei"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Data
            </label>
            <input
              type="text"
              name="data"
              value={formData.data}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Data bytes"
              required
            />
          </div>
        </div>
        
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Transaction Gas Limit</h3>
          <input
            type="text"
            name="txGasLimit"
            value={formData.txGasLimit}
            onChange={handleInputChange}
            className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
            placeholder="Gas limit for transaction"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Gas limit for the entire transaction (not L2 gas limit)</p>
        </div>
        
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Token Total Fee Amount (Calculated)</h3>
          <p className="font-mono text-sm break-all">{calculateTokenTotalFeeAmount()}</p>
          <p className="text-sm break-all">≈ {ethers.utils.formatEther(calculateTokenTotalFeeAmount())} ETH</p>
          <p className="text-xs text-gray-400 mt-1">This is automatically calculated as l2CallValue + maxSubmissionCost</p>
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          disabled={!isConnected || isLoading || !isArbitrumNetwork}
        >
          {isLoading ? 'Processing...' : 'Create Bridge Transaction'}
        </button>
      </form>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Debug Information</h3>
          <pre className="text-xs text-gray-400 overflow-auto max-h-60 p-2 bg-black bg-opacity-50 rounded">
            {debugInfo}
          </pre>
        </div>
      )}
      
      <div className="mt-6 border-t border-slate-700 pt-4">
        <h3 className="text-sm font-semibold mb-2">About This Bridge</h3>
        <p className="text-sm text-gray-300">
          This interface allows you to create a bridge transaction from Arbitrum to AnimeChain.
          The bridge uses Arbitrum's createRetryableTicket function to send tokens across chains.
        </p>
        <p className="text-sm text-gray-300 mt-2">
          Bridge Contract Address: <span className="font-mono text-xs">{BRIDGE_CONTRACT_ADDRESS}</span>
        </p>
      </div>
    </div>
  );
} 