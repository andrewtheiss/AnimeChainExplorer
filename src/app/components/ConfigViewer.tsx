"use client";

import React, { useState } from 'react';
import { config } from '../config';

interface ConfigSection {
  title: string;
  items: {
    key: string;
    value: string | boolean;
    description?: string;
  }[];
}

export default function ConfigViewer() {
  const [activeSection, setActiveSection] = useState<string | null>("animeChain");
  const [isExpanded, setIsExpanded] = useState(false);

  // Organize config into sections for UI
  const configSections: ConfigSection[] = [
    {
      title: "AnimeChain",
      items: [
        { key: "Mainnet RPC URL", value: config.animeChain.mainnet.rpcUrl, description: "HTTP RPC endpoint for AnimeChain mainnet" },
        { key: "Mainnet WebSocket URL", value: config.animeChain.mainnet.wsUrl, description: "WebSocket endpoint for AnimeChain mainnet" },
        { key: "Testnet RPC URL", value: config.animeChain.testnet.rpcUrl, description: "HTTP RPC endpoint for AnimeChain testnet" },
        { key: "Testnet WebSocket URL", value: config.animeChain.testnet.wsUrl, description: "WebSocket endpoint for AnimeChain testnet" },
        { key: "EntryPoint Address", value: config.animeChain.entryPointAddress, description: "The EIP-4337 EntryPoint contract address" },
      ],
    },
    {
      title: "Alchemy",
      items: [
        { key: "API Key", value: config.alchemy.apiKey, description: "Alchemy API key for blockchain access" },
        { key: "RPC Base URL", value: config.alchemy.rpcBaseUrl, description: "Base URL for Alchemy RPC endpoints" },
        { key: "Gas Manager Policy ID", value: config.alchemy.gasManagerPolicyId || "Not configured", description: "Policy ID for Alchemy Gas Manager" },
      ],
    },
    {
      title: "Account Abstraction",
      items: [
        { key: "AA Enabled", value: config.accountAbstraction.enabled, description: "Is Account Abstraction enabled" },
        { key: "Direct AA Enabled", value: config.accountAbstraction.directEnabled, description: "Is Direct Account Abstraction enabled" },
        { key: "Gas Manager Policy ID", value: config.accountAbstraction.gasManagerPolicyId, description: "Gas Manager Policy ID for AA" },
      ],
    },
    {
      title: "Authentication",
      items: [
        { key: "Privy App ID", value: config.privy.appId, description: "Privy App ID for authentication" },
        { key: "Privy Client ID", value: config.privy.clientId, description: "Privy Client ID for authentication" },
      ],
    },
    {
      title: "Analytics",
      items: [
        { key: "PostHog Key", value: config.posthog.key, description: "PostHog API key for analytics" },
        { key: "PostHog Host", value: config.posthog.host, description: "PostHog host URL" },
      ],
    },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-6 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Configuration Variables</h2>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
        >
          {isExpanded ? "Collapse" : "Expand All"}
        </button>
      </div>

      <div className="space-y-4">
        {configSections.map((section) => (
          <div key={section.title} className="border border-slate-700 rounded-md overflow-hidden">
            <button
              className="w-full bg-slate-700 p-3 text-left font-medium flex justify-between items-center"
              onClick={() => setActiveSection(activeSection === section.title ? null : section.title)}
            >
              {section.title}
              <svg
                className={`w-5 h-5 transition-transform ${
                  activeSection === section.title || isExpanded ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {(activeSection === section.title || isExpanded) && (
              <div className="p-3 bg-slate-800">
                <table className="w-full border-collapse">
                  <thead className="text-xs text-gray-400 uppercase">
                    <tr>
                      <th className="p-2 text-left">Key</th>
                      <th className="p-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {section.items.map((item) => (
                      <tr key={item.key} className="hover:bg-slate-700/30">
                        <td className="p-2 text-sm">
                          <div className="font-medium">{item.key}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="p-2 font-mono text-xs break-all">
                          {typeof item.value === "boolean" 
                            ? (item.value ? "true" : "false") 
                            : item.value || "Not configured"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 