"use client";

import React, { useState, useEffect } from 'react';

// NFT metadata for MetaMask
const NFT_METADATA = {
  tokenAddress: '0x0CA9229a48a154C62F8398e52a8fE082E9587D19',
  tokenId: '1', // This might need to be dynamic based on actual token ID
  tokenSymbol: 'ANIMETCG',
  tokenName: 'Anime TCG Booster Box',
  tokenImage: '/images/boosterbox.png', // Image is in the public directory
  tokenVideo: '/videos/boosterbox.webm', // Video is in the public directory
};

// No need to redeclare the Window interface as it's already declared in ethereum.d.ts
// We'll use the existing implementation

export default function AddToMetaMaskButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Handle video loading
  useEffect(() => {
    const videoElement = document.getElementById('nft-video') as HTMLVideoElement;
    
    if (videoElement) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      
      // Clean up
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, []);

  const addToMetaMask = async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      
      // Check if MetaMask is installed
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error('MetaMask is not installed. Please install MetaMask first.');
      }

      // Request to add NFT to MetaMask using the correct parameter format
      // For MetaMask's wallet_watchAsset method
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [
          {
            type: 'ERC721',
            options: {
              address: NFT_METADATA.tokenAddress,
              tokenId: NFT_METADATA.tokenId,
              symbol: NFT_METADATA.tokenSymbol,
              name: NFT_METADATA.tokenName,
              image: window.location.origin + NFT_METADATA.tokenImage,
            },
          },
        ],
      });

      if (wasAdded) {
        setStatus('success');
      } else {
        throw new Error('NFT wasn\'t added to MetaMask.');
      }
    } catch (error) {
      console.error('Error adding NFT to MetaMask:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="relative bg-slate-800 rounded-lg overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 opacity-20">
        <video 
          id="nft-video"
          autoPlay 
          loop 
          muted 
          playsInline 
          className={`w-full h-full object-cover ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src={NFT_METADATA.tokenVideo} type="video/webm" />
        </video>
        {/* Gradient fallback while video loads */}
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}></div>
      </div>
      
      {/* Content */}
      <div className="relative p-6 z-10">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-slate-700/70 flex-shrink-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            >
              <source src={NFT_METADATA.tokenVideo} type="video/webm" />
              <img src={NFT_METADATA.tokenImage} alt="TCG Booster Box" className="w-full h-full object-cover" />
            </video>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-medium mb-1">{NFT_METADATA.tokenName}</h3>
            <p className="text-sm text-gray-300 mb-4">Add this NFT to your MetaMask wallet for easy access</p>
            
            <button
              onClick={addToMetaMask}
              disabled={status === 'loading'}
              className={`
                inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium transition-colors
                ${status === 'loading' ? 'bg-gray-600 cursor-wait' : 
                  status === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                  status === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                  'bg-[#F6851B] hover:bg-[#E2761B]'}
              `}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding to MetaMask...
                </>
              ) : status === 'success' ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Added to MetaMask
                </>
              ) : status === 'error' ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Try Again
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09202L32.9582 1Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.04183 1L15.0236 10.8236L12.7335 5.09202L2.04183 1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M28.1841 23.6783L24.6484 29.0432L32.2365 31.1136L34.4206 23.8111L28.1841 23.6783Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M0.601562 23.8111L2.76379 31.1136L10.3519 29.0432L6.81611 23.6783L0.601562 23.8111Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.93143 14.7011L7.85205 17.8592L15.3876 18.1949L15.131 10.0237L9.93143 14.7011Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M25.0686 14.7011L19.8167 9.91827L19.6125 18.1949L27.148 17.8592L25.0686 14.7011Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.3519 29.0432L14.9218 26.8331L10.9896 23.8636L10.3519 29.0432Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.0781 26.8331L24.6481 29.0432L24.0103 23.8636L20.0781 26.8331Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add to MetaMask
                </>
              )}
            </button>
            
            {errorMessage && (
              <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 