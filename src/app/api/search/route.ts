import { NextRequest, NextResponse } from 'next/server';
import { searchMusic } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const filter = (searchParams.get('filter') as 'songs' | 'albums' | 'artists' | 'all') || 'songs';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
    }

    const results = await searchMusic(query.trim(), filter);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('API /api/search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform search' },
      { status: 500 }
    );
  }
}
