/**
 * Utility functions for making API requests to blockchain explorer endpoints
 * using our local proxy to avoid CORS issues
 */

/**
 * Fetch blockchain statistics from the explorer API
 */
export async function fetchBlockchainStats() {
  try {
    const response = await fetch('/api/blockchain/stats');
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    throw error;
  }
}

/**
 * Fetch blockchain transactions with optional query parameters
 */
export async function fetchTransactions(params?: Record<string, string | number>) {
  try {
    // Build query string from params object
    const queryParams = params 
      ? new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, v.toString()])
        ).toString()
      : '';
    
    const url = queryParams 
      ? `/api/blockchain/transactions?${queryParams}`
      : '/api/blockchain/transactions';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * General function to fetch data from any explorer endpoint
 */
export async function fetchFromExplorer(
  endpoint: string,
  params?: Record<string, string | number>
) {
  try {
    // Convert params object to query string, adding the endpoint parameter
    const queryObj = { endpoint, ...params };
    const queryParams = new URLSearchParams(
      Object.entries(queryObj).map(([k, v]) => [k, v?.toString() || ''])
    ).toString();
    
    const response = await fetch(`/api/blockchain/proxy?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
} 