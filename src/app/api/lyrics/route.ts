import { NextRequest, NextResponse } from 'next/server';
import { fetchLyrics } from '@/lib/lyrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track');
    const artist = searchParams.get('artist') || '';
    const duration = parseFloat(searchParams.get('duration') || '0');

    if (!track) {
      return NextResponse.json({ error: 'Track parameter is required' }, { status: 400 });
    }

    const lyricsData = await fetchLyrics(track, artist, duration);
    return NextResponse.json(lyricsData);
  } catch (error: any) {
    console.error('API /api/lyrics error:', error);
    return NextResponse.json(
      { instrumental: false, lines: [], error: error.message },
      { status: 500 }
    );
  }
}
