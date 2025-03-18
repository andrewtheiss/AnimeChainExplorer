import { NextRequest, NextResponse } from 'next/server';

// Configure the route
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache this route

// Explorer API URL for transactions
const EXPLORER_API_URL = "https://explorer-animechain-39xf6m45e3.t.conduit.xyz/api/v2/transactions";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Construct the target URL with query parameters
    const targetUrl = queryString 
      ? `${EXPLORER_API_URL}?${queryString}` 
      : EXPLORER_API_URL;
    
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
    console.error('Error fetching blockchain transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 