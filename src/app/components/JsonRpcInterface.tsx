"use client";

import React, { useState, useEffect } from 'react';
import { config, DEFAULT_JSON_RPC_PAYLOAD } from '../config';

// Define proper types for JSON-RPC
interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: unknown[];
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: unknown;
  error?: JsonRpcError;
}

interface JsonRpcInterfaceProps {
  defaultRpcUrl?: string;
}

export default function JsonRpcInterface({ defaultRpcUrl }: JsonRpcInterfaceProps) {
  const [rpcUrl, setRpcUrl] = useState(defaultRpcUrl || config.animeChain.mainnet.rpcUrl);
  const [payload, setPayload] = useState(JSON.stringify(DEFAULT_JSON_RPC_PAYLOAD, null, 2));
  const [response, setResponse] = useState<JsonRpcResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);

  // Validate JSON when payload changes
  useEffect(() => {
    try {
      JSON.parse(payload);
      setIsValidJson(true);
    } catch {
      // No need to reference the error if we're not using it
      setIsValidJson(false);
    }
  }, [payload]);

  // Send JSON-RPC request
  const sendRequest = async () => {
    if (!isValidJson) {
      setError("Invalid JSON payload");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const parsedPayload = JSON.parse(payload) as JsonRpcRequest;
      
      const fetchResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedPayload),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json() as JsonRpcResponse;
      setResponse(data);
    } catch (err) {
      console.error('Error sending JSON-RPC request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset payload to default
  const resetPayload = () => {
    setPayload(JSON.stringify(DEFAULT_JSON_RPC_PAYLOAD, null, 2));
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">JSON-RPC Interface</h2>
      
      <div className="mb-4">
        <label htmlFor="rpcUrl" className="block text-sm font-medium text-gray-300 mb-2">
          RPC Endpoint URL
        </label>
        <input
          id="rpcUrl"
          type="text"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-white"
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="jsonPayload" className="block text-sm font-medium text-gray-300">
            JSON-RPC Payload
          </label>
          <button
            onClick={resetPayload}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
          >
            Reset to Default
          </button>
        </div>
        <textarea
          id="jsonPayload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={10}
          className={`w-full p-3 bg-slate-700 rounded border font-mono text-sm ${
            isValidJson ? 'border-slate-600' : 'border-red-500'
          }`}
          spellCheck="false"
        />
        {!isValidJson && (
          <p className="text-red-400 text-sm mt-1">Invalid JSON format</p>
        )}
      </div>
      
      <div className="mb-6">
        <button
          onClick={sendRequest}
          disabled={isLoading || !isValidJson}
          className={`w-full py-2 px-4 rounded font-medium ${
            isLoading || !isValidJson
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isLoading ? 'Sending Request...' : 'Send JSON-RPC Request'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-md p-3 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Response:</h3>
          <pre className="bg-slate-900 p-4 rounded-md overflow-auto max-h-80 text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 