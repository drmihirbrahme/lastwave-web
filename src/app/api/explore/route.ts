import { NextResponse } from 'next/server';
import { getExploreFeed } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const feed = await getExploreFeed();
    return NextResponse.json(feed);
  } catch (error: any) {
    console.error('API /api/explore error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve explore feed' },
      { status: 500 }
    );
  }
}
