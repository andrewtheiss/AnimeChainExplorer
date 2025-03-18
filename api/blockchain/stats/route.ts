import { NextRequest, NextResponse } from 'next/server';

// Configure the route
// Since we're no longer using static export, we can keep this simple
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache this route

// Explorer API URL
const EXPLORER_API_URL = "https://explorer-animechain-39xf6m45e3.t.conduit.xyz/api/v2/stats";

export async function GET(_request: NextRequest) {
  try {
    // Fetch from the actual API
    const response = await fetch(EXPLORER_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache the response
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
    console.error('Error fetching blockchain stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 