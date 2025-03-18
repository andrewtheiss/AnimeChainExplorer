import { NextRequest, NextResponse } from 'next/server';

// Configure the route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache this route

// Base Explorer API URL
const BASE_EXPLORER_URL = "https://explorer-animechain-39xf6m45e3.t.conduit.xyz/api/v2";

export async function GET(request: NextRequest) {
  try {
    // Get target endpoint from query parameter
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    
    // Clone the search params and remove the endpoint parameter
    // to avoid sending it to the actual API
    const apiParams = new URLSearchParams(searchParams.toString());
    apiParams.delete('endpoint');
    const queryString = apiParams.toString();
    
    // Return error if no endpoint is provided
    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing required 'endpoint' query parameter" },
        { status: 400 }
      );
    }
    
    // Construct the target URL
    const targetUrl = queryString 
      ? `${BASE_EXPLORER_URL}/${endpoint}?${queryString}` 
      : `${BASE_EXPLORER_URL}/${endpoint}`;
    
    // Fetch from the actual API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Get the response data
    const data = await response.json();

    // Return the data with appropriate headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error proxying explorer API request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 