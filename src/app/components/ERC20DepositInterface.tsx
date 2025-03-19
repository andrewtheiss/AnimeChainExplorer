"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Define the Ethereum window interface
interface EthereumWindow extends Window {
  ethereum?: any;
}

// ERC20 Token ABI - Just what we need for approving and transferring
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// Bridge contract ABI (just the depositERC20 function we need)
const BRIDGE_DEPOSIT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "depositERC20",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Constants for the bridge and token
const BRIDGE_CONTRACT_ADDRESS = '0xA203252940839c8482dD4b938b4178f842E343D7';
const ANIME_TOKEN_ADDRESS = '0x37a645648dF29205C6261289983FB04ECD70b4B3'; // Updated Animecoin token address for Arbitrum
const DEFAULT_DEPOSIT_AMOUNT = '9.2'; // Default amount to deposit in Animecoin

export default function ERC20DepositInterface() {
  // State variables
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [bridgeContract, setBridgeContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isArbitrumNetwork, setIsArbitrumNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isApproved, setIsApproved] = useState(false);
  const [depositStep, setDepositStep] = useState<'approve' | 'deposit'>('approve');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: DEFAULT_DEPOSIT_AMOUNT,
    gasLimit: '200000',
    maxFeePerGas: '0.01', // In Gwei
    maxPriorityFeePerGas: '0', // In Gwei
  });

  // Helper function to safely format address as checksum
  const safeChecksum = (address: string): string => {
    try {
      return ethers.utils.getAddress(address);
    } catch (err) {
      console.warn(`Warning: Invalid address format for ${address}`);
      return address; // Return original if invalid to avoid breaking the UI
    }
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
      
      try {
        // Ensure addresses are properly checksummed using our safe function
        const checksummedBridgeAddress = safeChecksum(BRIDGE_CONTRACT_ADDRESS);
        const checksummedTokenAddress = safeChecksum(ANIME_TOKEN_ADDRESS);
        
        // Create contract instances with checksummed addresses
        const bridgeContract = new ethers.Contract(checksummedBridgeAddress, BRIDGE_DEPOSIT_ABI, signer);
        const tokenContract = new ethers.Contract(checksummedTokenAddress, ERC20_ABI, signer);
        
        setBridgeContract(bridgeContract);
        setTokenContract(tokenContract);
        setAccount(account);
        setIsConnected(true);
        setError(null);
        
        // Fetch token balance
        await fetchTokenBalance(account, tokenContract);
      } catch (contractErr: any) {
        console.error('Error initializing contracts:', contractErr);
        setError(`Error initializing contracts. Please ensure you have the correct addresses. Details: ${contractErr.message}`);
        // Still set connected state but show error
        setAccount(account);
        setIsConnected(true);
      }
      
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(`Failed to connect wallet: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch token balance
  const fetchTokenBalance = async (address: string, contract: ethers.Contract | null) => {
    if (!contract) return;
    
    try {
      // Use safe checksum function
      const checksummedAddress = safeChecksum(address);
      const balance = await contract.balanceOf(checksummedAddress);
      setTokenBalance(ethers.utils.formatEther(balance));
    } catch (err: any) {
      console.error('Error fetching token balance:', err);
      // Don't break the UI if balance check fails
      setTokenBalance('Error');
    }
  };

  // Disconnect from MetaMask
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBridgeContract(null);
    setTokenContract(null);
    setIsConnected(false);
    setIsArbitrumNetwork(false);
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    setIsApproved(false);
    setDepositStep('approve');
    setTokenBalance('0');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Approve token transfer
  const approveTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    
    if (!tokenContract || !signer || !account) {
      setError('Wallet not connected or token contract not initialized');
      return;
    }
    
    if (!isArbitrumNetwork) {
      setError('Please connect to Arbitrum network');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert amount to wei
      const amountInWei = ethers.utils.parseEther(formData.amount);
      
      // Use safe checksum function
      const checksummedBridgeAddress = safeChecksum(BRIDGE_CONTRACT_ADDRESS);
      
      // Gas settings
      const gasSettings = {
        gasLimit: ethers.BigNumber.from(formData.gasLimit),
        maxFeePerGas: ethers.utils.parseUnits(formData.maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits(formData.maxPriorityFeePerGas, 'gwei')
      };
      
      // Display debug info before sending transaction
      setDebugInfo(JSON.stringify({
        approve: {
          spender: checksummedBridgeAddress,
          amount: formData.amount,
          amountWei: amountInWei.toString(),
          fromAddress: account,
          gasSettings
        }
      }, null, 2));
      
      // Approve tokens to be spent by the bridge contract
      const tx = await tokenContract.approve(
        checksummedBridgeAddress,
        amountInWei,
        gasSettings
      );
      
      setDebugInfo(prev => 
        prev + '\n\nApproval transaction sent! Hash: ' + tx.hash + 
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
      setIsApproved(true);
      setDepositStep('deposit');
      setDebugInfo(prev => prev + '\n\nApproval successful! Receipt: ' + JSON.stringify(receipt, null, 2));
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      let errorMessage = `Failed to approve tokens: ${err.message || 'Unknown error'}`;
      
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction simulation failed. This could be due to insufficient funds or invalid parameters.';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed on-chain. The token contract rejected the transaction.';
      } else if (err.code === 'INVALID_ARGUMENT') {
        errorMessage = 'Invalid argument: This may be due to an incorrect address format. Addresses are being corrected.';
      }
      
      setError(errorMessage);
      setDebugInfo(prev => prev + '\n\nApproval error: ' + JSON.stringify({
        error: err.message,
        code: err.code,
        details: err.data ? err.data.message : 'No additional details'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit tokens to bridge
  const depositTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    
    if (!bridgeContract || !signer || !account) {
      setError('Wallet not connected or bridge contract not initialized');
      return;
    }
    
    if (!isArbitrumNetwork) {
      setError('Please connect to Arbitrum network');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert amount to wei
      const amountInWei = ethers.utils.parseEther(formData.amount);
      
      // Gas settings
      const gasSettings = {
        gasLimit: ethers.BigNumber.from(formData.gasLimit),
        maxFeePerGas: ethers.utils.parseUnits(formData.maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits(formData.maxPriorityFeePerGas, 'gwei')
      };
      
      // Display debug info before sending transaction
      setDebugInfo(JSON.stringify({
        deposit: {
          amount: formData.amount,
          amountWei: amountInWei.toString(),
          fromAddress: account,
          gasSettings
        }
      }, null, 2));
      
      // Deposit tokens to the bridge
      const tx = await bridgeContract.depositERC20(
        amountInWei,
        gasSettings
      );
      
      setDebugInfo(prev => 
        prev + '\n\nDeposit transaction sent! Hash: ' + tx.hash + 
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
      setDebugInfo(prev => prev + '\n\nDeposit successful! Receipt: ' + JSON.stringify(receipt, null, 2));
      
      // Reset for next deposit
      setIsApproved(false);
      setDepositStep('approve');
      
      // Update token balance
      if (account && tokenContract) {
        await fetchTokenBalance(account, tokenContract);
      }
    } catch (err: any) {
      console.error('Error depositing tokens:', err);
      let errorMessage = `Failed to deposit tokens: ${err.message || 'Unknown error'}`;
      
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction simulation failed. This could be due to insufficient funds or invalid parameters.';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed on-chain. The bridge contract rejected the transaction.';
      } else if (err.code === 'INVALID_ARGUMENT') {
        errorMessage = 'Invalid argument: This may be due to an incorrect address format. Addresses are being corrected.';
      }
      
      setError(errorMessage);
      setDebugInfo(prev => prev + '\n\nDeposit error: ' + JSON.stringify({
        error: err.message,
        code: err.code,
        details: err.data ? err.data.message : 'No additional details'
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
          
          // Fetch new token balance
          if (tokenContract) {
            fetchTokenBalance(accounts[0], tokenContract);
          }
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
  }, [account, tokenContract]);

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Animecoin Bridge Deposit</h2>
      
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
              <p className="text-sm mt-2">
                <span className="text-gray-300">Animecoin Balance:</span>{' '}
                <span className="font-semibold">{tokenBalance} ANIME</span>
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
            <p>Transaction successful!</p>
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
      
      {isConnected && (
        <div className="bg-slate-700/30 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium mb-2">Deposit Process</h3>
          <div className="flex items-center mb-4">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${depositStep === 'approve' ? 'bg-blue-600' : 'bg-green-600'}`}>
              1
            </div>
            <div className="h-1 w-8 bg-slate-600 mx-2"></div>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${depositStep === 'deposit' ? 'bg-blue-600' : 'bg-slate-600'}`}>
              2
            </div>
          </div>
          <p className="text-sm text-gray-300">
            {depositStep === 'approve' 
              ? 'Step 1: Approve the bridge contract to use your Animecoin tokens' 
              : 'Step 2: Deposit your approved tokens to the bridge contract'}
          </p>
        </div>
      )}
      
      <form onSubmit={depositStep === 'approve' ? approveTokens : depositTokens} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Deposit Amount (ANIME)
            </label>
            <input
              type="text"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
              placeholder="Amount of ANIME tokens"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Default: {DEFAULT_DEPOSIT_AMOUNT} ANIME</p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Gas Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Gas Limit
                </label>
                <input
                  type="text"
                  name="gasLimit"
                  value={formData.gasLimit}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
                  placeholder="Gas limit"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Max Fee (Gwei)
                </label>
                <input
                  type="text"
                  name="maxFeePerGas"
                  value={formData.maxFeePerGas}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
                  placeholder="Max fee per gas in Gwei"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Priority Fee (Gwei)
                </label>
                <input
                  type="text"
                  name="maxPriorityFeePerGas"
                  value={formData.maxPriorityFeePerGas}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 text-sm font-mono"
                  placeholder="Max priority fee per gas in Gwei"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full px-4 py-3 rounded-md transition-colors ${
            depositStep === 'approve' 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          disabled={!isConnected || isLoading || !isArbitrumNetwork}
        >
          {isLoading 
            ? 'Processing...' 
            : depositStep === 'approve' 
              ? 'Step 1: Approve Tokens'
              : 'Step 2: Deposit Tokens'
          }
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
        <h3 className="text-sm font-semibold mb-2">About This Deposit</h3>
        <p className="text-sm text-gray-300">
          This interface allows you to deposit Animecoin tokens directly to the bridge contract.
          The deposit uses the depositERC20 function of the bridge contract.
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300">Addresses:</h4>
          <div className="mt-2 p-2 bg-slate-700/30 rounded-md">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Bridge Contract (Arbitrum):</span>{' '}
              <span className="font-mono text-xs break-all">{BRIDGE_CONTRACT_ADDRESS}</span>
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <span className="font-medium">Animecoin Token (Arbitrum):</span>{' '}
              <span className="font-mono text-xs break-all">{ANIME_TOKEN_ADDRESS}</span>
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <span className="font-medium">Animecoin Token (Ethereum L1):</span>{' '}
              <span className="font-mono text-xs break-all">0x4DC26fC5854e7648a064a4ABD590bBE71724C277</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 