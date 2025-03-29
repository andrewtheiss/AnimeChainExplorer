"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Image from 'next/legacy/image';
// Import the image
import animeImage from './anime_no_bg.png';

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

// ERC-20 ABI for token approval
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Constants for the bridge
const BRIDGE_CONTRACT_ADDRESS = '0xA203252940839c8482dD4b938b4178f842E343D7';
const DEFAULT_TO_ADDRESS = '0x3d069D76169DdC010B8f12d1bA03eAE945f879b3';
const DEFAULT_DATA = ethers.utils.toUtf8Bytes('superbridge');
const ANIME_TOKEN_ADDRESS = '0x37a645648dF29205C6261289983FB04ECD70b4B3'; // Arbitrum Anime token
const ANIMECHAIN_EXPLORER_URL = 'https://explorer-animechain-39xf6m45e3.t.conduit.xyz';

// Successful transaction parameter values
const DEFAULT_MAX_SUBMISSION_COST = '592196220000000';
const DEFAULT_GAS_LIMIT = '300000';
const DEFAULT_TX_GAS_LIMIT = '500000';
const DEFAULT_MAX_FEE_PER_GAS = '36000000';

export default function BridgeInterface() {
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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'not-approved' | 'approving' | 'approved'>('not-approved');
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  
  // Form state with display values (user-friendly)
  const [formData, setFormData] = useState({
    to: DEFAULT_TO_ADDRESS,
    // Display value is 1.0 ANIME (user-friendly) matching the provided value
    displayL2CallValue: '1.0',
    maxSubmissionCost: DEFAULT_MAX_SUBMISSION_COST,
    excessFeeRefundAddress: DEFAULT_TO_ADDRESS,
    callValueRefundAddress: DEFAULT_TO_ADDRESS,
    gasLimit: DEFAULT_GAS_LIMIT, // L2 gas limit
    maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS, // Added for the bridge contract param
    data: '', // Empty data according to valid transaction
    txGasLimit: DEFAULT_TX_GAS_LIMIT // Transaction gas limit as fallback
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

  // Get the actual L2CallValue in wei from the display value
  const getL2CallValueInWei = () => {
    try {
      // Parse the display value and convert to wei
      return ethers.utils.parseEther(formData.displayL2CallValue).toString();
    } catch (err) {
      console.error('Error converting L2CallValue to wei:', err);
      return ethers.utils.parseEther('1').toString(); // Default to 1 ANIME in wei if there's an error
    }
  };

  // Calculate the token total fee amount (l2CallValue + maxSubmissionCost + additional fee)
  const calculateTokenTotalFeeAmount = () => {
    try {
      const l2CallValue = ethers.BigNumber.from(getL2CallValueInWei());
      const maxSubmissionCost = ethers.BigNumber.from(formData.maxSubmissionCost);
      
      // First calculate the base amount (l2CallValue + maxSubmissionCost)
      const baseAmount = l2CallValue.add(maxSubmissionCost);
      
      // Now add approximately 20% more to account for additional fees
      // Calculate 20% of maxSubmissionCost
      const additionalFee = maxSubmissionCost.mul(20).div(100);
      
      // The total is the base amount plus the additional fee
      const total = baseAmount.add(additionalFee);
      
      console.log("Calculated token total fee:", {
        l2CallValue: l2CallValue.toString(), 
        maxSubmissionCost: maxSubmissionCost.toString(),
        baseAmount: baseAmount.toString(),
        additionalFee: additionalFee.toString(),
        total: total.toString()
      });
      
      return total.toString();
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
  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        setError(null);

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setAccount(account);

        // Initialize ethers provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        
        const signer = provider.getSigner();
        setSigner(signer);

        // Get network
        const network = await provider.getNetwork();
        setIsArbitrumNetwork(network.chainId === 42161);

        // Initialize contracts
        const bridgeContract = new ethers.Contract(
          BRIDGE_CONTRACT_ADDRESS,
          BRIDGE_ABI,
          signer
        );
        setBridgeContract(bridgeContract);

        const tokenContract = new ethers.Contract(
          ANIME_TOKEN_ADDRESS,
          ERC20_ABI,
          signer
        );
        setTokenContract(tokenContract);

        setIsConnected(true);
        
        // Update form addresses with connected wallet address
        updateFormAddresses(account);
        
        // Check approval status
        checkApprovalStatus(account, tokenContract);
        
        // Fetch token balance
        fetchTokenBalance(account);
        
      } catch (err: any) {
        console.error('Error connecting wallet:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Ethereum wallet not detected. Please install MetaMask.');
    }
  }, []);

  // Check if token is already approved for the bridge contract
  const checkApprovalStatus = async (account: string, tokenContract: ethers.Contract) => {
    try {
      // Calculate the amount we need approval for (token amount + fees)
      const tokenAmount = ethers.utils.parseEther(formData.displayL2CallValue);
      const totalRequiredAmount = ethers.BigNumber.from(calculateTokenTotalFeeAmount());
      
      // Use safe checksum function
      const checksummedBridgeAddress = safeChecksum(BRIDGE_CONTRACT_ADDRESS);
      const checksummedAccount = safeChecksum(account);
      
      // Check allowance
      const allowance = await tokenContract.allowance(checksummedAccount, checksummedBridgeAddress);
      
      if (allowance.gte(totalRequiredAmount)) {
        setApprovalStatus('approved');
      } else {
        setApprovalStatus('not-approved');
      }
      
      setDebugInfo(JSON.stringify({
        allowanceCheck: {
          currentAllowance: ethers.utils.formatEther(allowance) + " ANIME",
          requiredForBridge: formData.displayL2CallValue + " ANIME",
          requiredWithFees: ethers.utils.formatEther(totalRequiredAmount) + " ANIME",
          status: allowance.gte(totalRequiredAmount) ? 'Sufficient allowance' : 'Insufficient allowance - approval needed'
        }
      }, null, 2));
    } catch (err: any) {
      console.error('Error checking approval status:', err);
      setApprovalStatus('not-approved');
    }
  };

  // Handle token approval
  const handleTokenApproval = async () => {
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
      setApprovalStatus('approving');
      setError(null);
      setApprovalTxHash(null);
      
      // Use the total required amount including fees for approval
      const tokenAmount = ethers.utils.parseEther(formData.displayL2CallValue);
      const totalRequiredAmount = ethers.BigNumber.from(calculateTokenTotalFeeAmount());
      
      // Use safe checksum function
      const checksummedBridgeAddress = safeChecksum(BRIDGE_CONTRACT_ADDRESS);
      
      // Let MetaMask handle gas estimation - don't specify gas params
      // Only set gas limit as a fallback
      const gasSettings = {
        gasLimit: ethers.BigNumber.from(200000) // Standard gas limit for approvals
        // Removed maxFeePerGas and maxPriorityFeePerGas to use network defaults
      };
      
      // Display debug info before sending transaction
      setDebugInfo(JSON.stringify({
        approve: {
          spender: checksummedBridgeAddress,
          amount: formData.displayL2CallValue, // Show user-friendly amount
          displayApprovalAmount: ethers.utils.formatEther(totalRequiredAmount) + ' ANIME', // Total with fees
          amountWei: totalRequiredAmount.toString(), // Total required amount in wei
          fromAddress: account,
          gasSettings: "Using MetaMask suggested gas values"
        }
      }, null, 2));
      
      // Approve tokens to be spent by the bridge contract
      const tx = await tokenContract.approve(
        checksummedBridgeAddress,
        totalRequiredAmount, // Approve the total required amount
        gasSettings
      );
      
      setApprovalTxHash(tx.hash);
      setDebugInfo(JSON.stringify({
        approve: {
          status: "sent",
          txHash: tx.hash,
          spender: checksummedBridgeAddress,
          amount: formData.displayL2CallValue, 
          displayApprovalAmount: ethers.utils.formatEther(totalRequiredAmount) + ' ANIME',
          amountWei: totalRequiredAmount.toString(),
          message: "Approval transaction sent! Waiting for confirmation..."
        }
      }, null, 2));
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw {
          message: 'Transaction reverted on-chain',
          receipt: receipt,
          code: 'CALL_EXCEPTION'
        };
      }
      
      setApprovalStatus('approved');
      setDebugInfo(JSON.stringify({
        approve: {
          status: "success",
          txHash: tx.hash,
          spender: checksummedBridgeAddress,
          amount: formData.displayL2CallValue,
          displayApprovalAmount: ethers.utils.formatEther(totalRequiredAmount) + ' ANIME',
          amountWei: totalRequiredAmount.toString(),
          message: "Approval successful!"
        }
      }, null, 2));
      
    } catch (err: any) {
      console.error('Error approving token:', err);
      let errorMessage = `Failed to approve token: ${err.message || 'Unknown error'}`;
      
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction simulation failed. This could be due to insufficient funds or invalid parameters.';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed on-chain. The token contract rejected the transaction.';
      } else if (err.code === 'INVALID_ARGUMENT') {
        errorMessage = 'Invalid argument: This may be due to an incorrect address format. Addresses are being corrected.';
      }
      
      setError(errorMessage);
      setDebugInfo(JSON.stringify({
        approveError: {
          error: err.message,
          code: err.code,
          details: err.data ? err.data.message : 'No additional details'
        }
      }, null, 2));
      
      setApprovalStatus('not-approved');
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
    setTokenContract(null);
    setIsConnected(false);
    setIsArbitrumNetwork(false);
    setError(null);
    setTxHash(null);
    setDebugInfo(null);
    setApprovalStatus('not-approved');
    setApprovalTxHash(null);
    
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
    
    // Add validation for ANIME amount
    if (name === 'displayL2CallValue') {
      // Validate that the input is a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Don't allow values over 50 ANIME
        if (numValue > 50) {
          setError('Amount cannot exceed 50 ANIME tokens');
          return;
        } else {
          // Clear error if it was previously set
          if (error === 'Amount cannot exceed 50 ANIME tokens' || error === 'Amount cannot exceed 5 ANIME tokens') {
            setError(null);
          }
        }
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle bridge transaction
  const handleBridgeTransaction = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!signer || !bridgeContract || !tokenContract || !account || !provider) {
      setError('Please connect your wallet first');
      return;
    }

    if (approvalStatus !== 'approved') {
      setError('Please approve token spending first');
      return;
    }
    
    // Add validation to prevent amounts over 50 ANIME
    const amount = parseFloat(formData.displayL2CallValue);
    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > 50) {
      setError('Amount cannot exceed 50 ANIME tokens');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // Thorough token balance check using raw call
      const checksummedAddress = safeChecksum(account);
      const addressWithoutPrefix = checksummedAddress.substring(2).toLowerCase();
      const balanceCallData = `0x70a08231${'0'.repeat(24)}${addressWithoutPrefix}`;
      
      const rawBalanceResult = await provider.call({
        to: ANIME_TOKEN_ADDRESS,
        data: balanceCallData
      });
      
      const userBalance = ethers.BigNumber.from(rawBalanceResult);
      const requiredAmount = ethers.utils.parseEther(formData.displayL2CallValue);
      const formattedBalance = ethers.utils.formatEther(userBalance);
      
      console.log('Balance check:', {
        userBalance: formattedBalance,
        requiredAmount: formData.displayL2CallValue,
        hasSufficientBalance: userBalance.gte(requiredAmount)
      });
      
      if (userBalance.lt(requiredAmount)) {
        const deficit = parseFloat(formData.displayL2CallValue) - parseFloat(formattedBalance);
        
        setDebugInfo(JSON.stringify({
          balanceCheck: {
            status: "insufficient",
            userBalance: formattedBalance + " ANIME",
            requiredAmount: formData.displayL2CallValue + " ANIME",
            deficit: deficit.toFixed(4) + " ANIME",
            message: "❌ Insufficient token balance"
          }
        }, null, 2));
        
        // Show a more detailed warning dialog to the user
        if (!window.confirm(
          `⚠️ INSUFFICIENT BALANCE WARNING ⚠️\n\n` +
          `Current balance: ${parseFloat(formattedBalance).toFixed(4)} ANIME\n` +
          `Required amount: ${formData.displayL2CallValue} ANIME\n` +
          `Deficit: ${deficit.toFixed(4)} ANIME\n\n` +
          `This transaction will likely fail. Do you still want to try?\n` +
          `(Not recommended)`
        )) {
          setIsLoading(false);
          return;
        }
      } else {
        // Update debug info with sufficient balance
        setDebugInfo(JSON.stringify({
          balanceCheck: {
            status: "sufficient",
            userBalance: formattedBalance + " ANIME",
            requiredAmount: formData.displayL2CallValue + " ANIME",
            message: "✅ Balance is sufficient for this transaction"
          }
        }, null, 2));
      }

      // Proceed with the transaction...
      // Create calldata
      const calldata = "0x"; // Empty bytes for calldata
      
      // Set gas parameters
      const gasParams = {};

      // Execute bridge transaction
      const tx = await bridgeContract.createRetryableTicket(
        formData.to,                                           // to address
        ethers.utils.parseEther(formData.displayL2CallValue),  // l2CallValue
        formData.maxSubmissionCost,                          // maxSubmissionCost
        formData.excessFeeRefundAddress,                     // excessFeeRefundAddress
        formData.callValueRefundAddress,                     // callValueRefundAddress
        formData.gasLimit,                                   // gasLimit
        formData.maxFeePerGas,                               // maxFeePerGas
        calculateTokenTotalFeeAmount(),                      // tokenTotalFeeAmount
        calldata                                             // data
      );

      setTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      // Refresh token balance and approval status after successful transaction
      fetchTokenBalance(account);
      checkApprovalStatus(account, tokenContract);
      
      // Set transaction success debug info
      setDebugInfo(JSON.stringify({
        bridgeTransaction: {
          status: "success",
          method: "createRetryableTicket",
          txHash: tx.hash,
          destination: formData.to,
          amount: formData.displayL2CallValue + " ANIME",
          tokenTotalFeeAmount: ethers.utils.formatEther(calculateTokenTotalFeeAmount()) + " ANIME",
          maxSubmissionCost: formData.maxSubmissionCost,
          gasLimit: formData.gasLimit,
          maxFeePerGas: formData.maxFeePerGas,
          message: "✅ Bridge transaction successful! Your funds will arrive on AnimeChain soon."
        }
      }, null, 2));
      
    } catch (err: any) {
      console.error('Bridge transaction error:', err);
      setError(err.message);
      
      // Enhanced error debugging
      const errorInfo = {
        error: err.message,
        code: err.code,
        reason: err.reason || "Unknown reason",
        transaction: {
          to: formData.to,
          amount: formData.displayL2CallValue,
          tokenAddress: ANIME_TOKEN_ADDRESS,
          bridgeAddress: BRIDGE_CONTRACT_ADDRESS
        }
      };
      
      // Provide more specific guidance based on error codes
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorInfo.reason = "The transaction cannot be simulated. This usually happens with insufficient token balance.";
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorInfo.reason = "You don't have enough ETH to pay for transaction gas fees.";
      } else if (err.code === 'CALL_EXCEPTION') {
        errorInfo.reason = "The transaction was reverted by the contract. Check your token balance and approvals.";
      }
      
      setDebugInfo(JSON.stringify(errorInfo, null, 2));
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
          // Reset approval status for new account
          setApprovalStatus('not-approved');
          if (tokenContract) {
            checkApprovalStatus(accounts[0], tokenContract);
          }
          
          // Fetch balance for new account
          fetchTokenBalance(accounts[0]);
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

  // Update approval status when amount changes
  useEffect(() => {
    if (isConnected && account && tokenContract) {
      checkApprovalStatus(account, tokenContract);
    }
  }, [formData.displayL2CallValue, isConnected, account, tokenContract]);

  // Fetch token balance with improved error handling and refresh interval
  const fetchTokenBalance = async (accountAddress: string) => {
    if (!provider || !accountAddress) {
      setTokenBalance('0');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Ensure account address is properly checksummed
      const checksummedAddress = safeChecksum(accountAddress);
      
      // Fetch token balance using raw call with method ID 0x70a08231
      const addressWithoutPrefix = checksummedAddress.substring(2).toLowerCase();
      const balanceCallData = `0x70a08231${'0'.repeat(24)}${addressWithoutPrefix}`;
      
      const rawBalanceResult = await provider.call({
        to: ANIME_TOKEN_ADDRESS,
        data: balanceCallData
      });
      
      const balanceResult = ethers.BigNumber.from(rawBalanceResult);
      const formattedBalance = ethers.utils.formatEther(balanceResult);
      setTokenBalance(formattedBalance);
      
      // Compare balance with required amount for bridging
      const amountInEther = parseFloat(formData.displayL2CallValue);
      const balanceInEther = parseFloat(formattedBalance);
      
      // Update debug info with balance status
      if (balanceInEther < amountInEther) {
        setDebugInfo(prev => {
          // Create a new balance check object
          const balanceCheckInfo = {
            sufficient: false,
            balance: balanceInEther.toFixed(4) + " ANIME",
            required: amountInEther.toFixed(4) + " ANIME",
            note: "Warning: Insufficient ANIME tokens for this bridge transaction"
          };
          
          // Instead of trying to parse previous debug info, simply create a new one
          return JSON.stringify({
            balanceCheck: balanceCheckInfo
          }, null, 2);
        });
      } else {
        // Create a new balance check info without trying to parse previous debug
        setDebugInfo(prev => {
          const balanceCheckInfo = {
            sufficient: true,
            balance: balanceInEther.toFixed(4) + " ANIME",
            required: amountInEther.toFixed(4) + " ANIME",
            note: "Balance is sufficient for this transaction"
          };
          
          return JSON.stringify({
            balanceCheck: balanceCheckInfo
          }, null, 2);
        });
      }
      
      console.log(`Token balance for ${accountAddress}: ${formattedBalance} ANIME`);
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setTokenBalance('0');
      setDebugInfo(JSON.stringify({
        balanceCheck: {
          error: true,
          message: "Failed to fetch token balance. Please check your connection."
        }
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auto-refresh for token balance
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // If connected, set up a timer to refresh balance every 15 seconds
    if (isConnected && account) {
      fetchTokenBalance(account);
      
      // Refresh balance periodically to keep it updated
      intervalId = setInterval(() => {
        if (isConnected && account) {
          fetchTokenBalance(account);
        }
      }, 15000); // Every 15 seconds
    }
    
    // Cleanup interval on component unmount or when connection status changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, account]);

  // Add useEffect to check balance when amount changes
  useEffect(() => {
    if (isConnected && account) {
      fetchTokenBalance(account);
    }
  }, [formData.displayL2CallValue, isConnected, account]);

  // Also refresh the token balance when returning to the Arbitrum network
  const handleNetworkChange = async (chainId: string) => {
    if (parseInt(chainId, 16) === 42161) {
      setIsArbitrumNetwork(true);
      if (account && tokenContract) {
        checkApprovalStatus(account, tokenContract);
        fetchTokenBalance(account);
      }
    } else {
      setIsArbitrumNetwork(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      {/* New Header with Image and Disclaimer */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-6 border-b border-slate-700">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="w-20 h-20 mr-4 relative flex-shrink-0">
            <Image 
              src={animeImage} 
              alt="AnimeChain Logo" 
              width={80} 
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AnimeChain Bridge</h2>
            <p className="text-gray-300 mt-1">ONE WAY bridge from Arbitrum to AnimeChain L3</p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <a 
            href="https://github.com/andrewtheiss/AnimeChainExplorer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Open Source on GitHub
          </a>
          <div className="text-yellow-400 text-sm px-3 py-2 bg-yellow-900/30 border border-yellow-800 rounded-md">
            <p className="font-medium">⚠️ BETA VERSION</p>
            <p className="text-xs mt-1">This bridge is in beta testing. Use at your own risk - we are not responsible for lost funds.</p>
          </div>
        </div>
      </div>

      {/* Warning banner directing to animechain.dev first */}
      <div className="mb-6 p-4 bg-blue-900/50 border-2 border-blue-500 rounded-lg text-center">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-blue-300 mb-2">PLEASE ONLY BRIDGE 5 ANIME OR LESS</h3>
          <p className="text-white font-medium mb-2">L3 Transactions take up to 20 minutes to confirm.  Be patient!</p>
          <div className="bg-black/30 p-3 rounded-lg max-w-2xl mt-1">
            <p className="text-blue-200 mb-2">
              For quick development, you can use the <span className="font-bold">FREE FAUCET</span> first:
            </p>
            <a 
              href="https://animechain.dev" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Visit animechain.dev Faucet
            </a>
            <p className="text-gray-300 text-sm mt-2">
              Only 0.1 ANIME is needed for development - save your tokens!
            </p>
          </div>
        </div>
      </div>

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
              <div className="flex items-center mt-2">
                <p className="text-sm text-gray-300">ANIME Balance:</p>
                <div className={`ml-2 px-2 py-1 rounded ${
                  parseFloat(tokenBalance) < parseFloat(formData.displayL2CallValue)
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-green-900/50 text-green-300'
                }`}>
                  <span className="font-mono font-medium">{parseFloat(tokenBalance).toFixed(4)}</span>
                </div>
              </div>
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
            <div className="mt-2 space-y-2">
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all block"
              >
                View transaction on Arbiscan: {txHash}
              </a>
              <a
                href={`${ANIMECHAIN_EXPLORER_URL}/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline block"
              >
                View your AnimeChain wallet address
              </a>
            </div>
          </div>
        )}
        
        {approvalTxHash && approvalStatus === 'approved' && (
          <div className="p-3 bg-green-900/50 border border-green-700 rounded-md text-green-200 mb-4">
            <p>Token approval successful!</p>
            <a
              href={`https://arbiscan.io/tx/${approvalTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
            >
              View approval on Arbiscan: {approvalTxHash}
            </a>
          </div>
        )}
      </div>
      
      {isConnected && (
        <>
          {/* Main bridge amount input - focused at the top */}
          <div className="mb-6 bg-slate-700/30 p-6 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-4">ANIME Amount to Bridge</h3>
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    name="displayL2CallValue"
                    value={formData.displayL2CallValue}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-600 rounded-md border border-slate-500 text-lg font-mono text-center"
                    placeholder="Amount in ANIME"
                    required
                  />
                  <div className="mt-1 text-sm">
                    <p className="text-gray-400">
                      Enter the amount of ANIME tokens you wish to bridge to AnimeChain.
                    </p>
                    <div className="mt-2 p-2 bg-blue-900/20 border border-blue-800/30 rounded text-blue-200 text-xs">
                      <p className="font-medium">💡 Recommendation: Use smaller transactions for better performance.</p>
                      <p className="mt-1">Maximum allowed: 50 ANIME tokens per transaction.</p>
                    </div>
                    {isConnected && (
                      <div className="mt-2 p-2 rounded">
                        <div className="flex justify-between items-center">
                          <p className="flex items-center">
                            <span className="text-gray-400 mr-2">Your balance:</span> 
                            <span className={`font-medium px-2 py-0.5 rounded ${
                              parseFloat(tokenBalance) < parseFloat(formData.displayL2CallValue)
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-green-900/50 text-green-300'
                            }`}>
                              {parseFloat(tokenBalance).toFixed(4)} ANIME
                            </span>
                          </p>
                          {parseFloat(tokenBalance) < parseFloat(formData.displayL2CallValue) && (
                            <p className="text-red-400 font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Insufficient balance
                            </p>
                          )}
                        </div>
                        {parseFloat(tokenBalance) < parseFloat(formData.displayL2CallValue) && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-800/30 rounded text-red-300 text-xs">
                            <p>You need {parseFloat(formData.displayL2CallValue).toFixed(4)} ANIME for this bridge transaction, but only have {parseFloat(tokenBalance).toFixed(4)} ANIME.</p>
                            <p className="mt-1">Please get more ANIME tokens before proceeding, or reduce the bridge amount.</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-yellow-400 mt-1">
                      The approval includes the bridge amount plus additional fees: approximately {ethers.utils.formatEther(calculateTokenTotalFeeAmount())} ANIME in total.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bridge process buttons in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={handleTokenApproval}
                disabled={isLoading || !isArbitrumNetwork || approvalStatus === 'approved'}
                className={`px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                  approvalStatus !== 'approved' 
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600'
                }`}
              >
                {isLoading && approvalStatus === 'approving'
                  ? 'Approving...'
                  : approvalStatus === 'approved'
                    ? 'Tokens Approved ✓'
                    : 'Step 1: Approve Tokens'
                }
              </button>
              
              <button
                onClick={handleBridgeTransaction}
                disabled={!isConnected || isLoading || !isArbitrumNetwork || approvalStatus !== 'approved'}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-sm font-medium"
              >
                {isLoading && approvalStatus === 'approved' ? 'Processing...' : 'Step 2: Bridge Tokens'}
              </button>
            </div>
          </div>
          
          {/* Advanced Mode Toggle */}
          <div className="flex items-center justify-end mb-4">
            <label className="flex items-center cursor-pointer">
              <span className="text-sm text-gray-300 mr-2">Advanced Mode</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={advancedMode} 
                  onChange={() => setAdvancedMode(!advancedMode)} 
                />
                <div className={`w-10 h-5 rounded-full transition ${advancedMode ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform transform ${advancedMode ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
          
          <div className="mb-6">
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Bridge Process</h3>
              
              {/* Add balance warning here */}
              {isConnected && parseFloat(tokenBalance) < parseFloat(formData.displayL2CallValue) && (
                <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-sm text-red-200">
                  <p className="font-medium">⚠️ Warning: Insufficient Balance</p>
                  <p>Your current balance ({parseFloat(tokenBalance).toFixed(4)} ANIME) is less than the amount you want to bridge ({formData.displayL2CallValue} ANIME).</p>
                  <p>The bridge transaction will likely fail even after approval.</p>
                </div>
              )}
              
              <div className="flex items-center mb-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  approvalStatus !== 'not-approved' ? 'bg-green-600' : 'bg-blue-600'
                } text-white text-sm mr-2`}>
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Approve ANIME tokens</p>
                  <p className="text-xs text-gray-400">Allow the bridge contract to use your tokens</p>
                </div>
                <div>
                  {approvalStatus === 'approving' && (
                    <div className="px-4 py-2 bg-blue-800 rounded-md text-sm flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Approval...
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mt-1 ml-10">
                The approval includes the bridge amount plus additional fees: approximately {ethers.utils.formatEther(ethers.BigNumber.from(calculateTokenTotalFeeAmount()))} ANIME in total
              </p>
              
              <div className="w-0.5 h-6 bg-gray-600 ml-4 mb-2"></div>
              
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  approvalStatus === 'approved' ? 'bg-blue-600' : 'bg-gray-600'
                } text-white text-sm mr-2`}>
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Create bridge transaction</p>
                  <p className="text-xs text-gray-400">Transfer tokens from Arbitrum to AnimeChain</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      <form className="space-y-4">
        {isConnected && (
          <>
            {/* Advanced settings */}
            {account && (
              <div className="p-3 bg-blue-900/30 border border-blue-800 rounded text-sm text-blue-200 mb-4">
                <p>👉 Your connected wallet address (<span className="font-mono">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>) has been set as the destination and refund addresses.</p>
                {!advancedMode && (
                  <p className="mt-1 text-xs">Enable Advanced Mode to customize these addresses if needed.</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Destination Address (to)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500'
                    }`}
                    placeholder="0x..."
                    required
                    disabled={!advancedMode}
                  />
                  {isConnected && formData.to === account && (
                    <div className="absolute right-2 top-2 px-2 py-0.5 bg-blue-900/50 border border-blue-700 rounded-sm text-xs text-blue-200">
                      Your wallet
                    </div>
                  )}
                </div>
                {isConnected && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.to === account 
                      ? "Using your connected wallet address" 
                      : "Warning: Not using your connected wallet address"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Excess Fee Refund Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="excessFeeRefundAddress"
                    value={formData.excessFeeRefundAddress}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="0x..."
                    required
                    disabled={!advancedMode}
                  />
                  {isConnected && formData.excessFeeRefundAddress === account && (
                    <div className="absolute right-2 top-2 px-2 py-0.5 bg-blue-900/50 border border-blue-700 rounded-sm text-xs text-blue-200">
                      Your wallet
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Call Value Refund Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="callValueRefundAddress"
                    value={formData.callValueRefundAddress}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="0x..."
                    required
                    disabled={!advancedMode}
                  />
                  {isConnected && formData.callValueRefundAddress === account && (
                    <div className="absolute right-2 top-2 px-2 py-0.5 bg-blue-900/50 border border-blue-700 rounded-sm text-xs text-blue-200">
                      Your wallet
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={`bg-slate-700/30 p-4 rounded-lg mt-4 ${!advancedMode ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Transaction Settings</h3>
                {!advancedMode && (
                  <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    Enable Advanced Mode to edit
                  </div>
                )}
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
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="Cost in wei"
                    required
                    disabled={!advancedMode}
                  />
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
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="Gas limit"
                    required
                    disabled={!advancedMode}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Data (Optional)
                  </label>
                  <input
                    type="text"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="Data bytes (can be empty)"
                    disabled={!advancedMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Transaction Gas Limit (Fallback)
                  </label>
                  <input
                    type="text"
                    name="txGasLimit"
                    value={formData.txGasLimit}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border text-sm font-mono ${
                      advancedMode 
                        ? 'bg-slate-700 border-slate-600' 
                        : 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                    placeholder="Gas limit for transaction"
                    required
                    disabled={!advancedMode}
                  />
                </div>
              </div>
            </div>
          </>
        )}
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
          The bridge uses Arbitrum's <span className="font-mono text-xs">createRetryableTicket</span> function to send tokens across chains.
        </p>
        <p className="text-sm text-gray-300 mt-2">
          <span className="font-medium">Bridge Contract:</span> <span className="font-mono text-xs">{BRIDGE_CONTRACT_ADDRESS}</span>
        </p>
        <p className="text-sm text-gray-300 mt-2">
          <span className="font-medium">Token Contract:</span> <span className="font-mono text-xs">{ANIME_TOKEN_ADDRESS}</span>
        </p>
      </div>
    </div>
  );
} 