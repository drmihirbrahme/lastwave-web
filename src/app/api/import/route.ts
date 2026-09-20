import { NextRequest, NextResponse } from 'next/server';
import { searchMusic } from '@/lib/youtube';
import { Track } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url, rawText } = await req.json();

    const matchedTracks: Track[] = [];
    const searchQueries: string[] = [];

    if (rawText && typeof rawText === 'string') {
      const lines = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      searchQueries.push(...lines.slice(0, 30));
    } else if (url && typeof url === 'string') {
      // If Spotify URL: fetch public HTML page and extract metadata tags
      try {
        const pageRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          },
        });
        const html = await pageRes.text();
        
        // Extract title or track items from open graph / json-ld / meta tags
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        
        if (descriptionMatch && descriptionMatch[1]) {
          const desc = descriptionMatch[1];
          // Usually Spotify description contains: "Artist 1, Artist 2, Track 1, Track 2..."
          const parts = desc.split('·')[0].split(',').map((p) => p.trim());
          searchQueries.push(...parts.slice(0, 20));
        } else if (titleMatch && titleMatch[1]) {
          searchQueries.push(titleMatch[1]);
        }
      } catch (e) {
        console.warn('Could not parse URL page directly, fallback query:', e);
      }
    }

    // Resolve search queries to YouTube Music tracks
    for (const q of searchQueries.slice(0, 15)) {
      if (!q || q.length < 2) continue;
      try {
        const res = await searchMusic(q, 'songs');
        if (res.songs.length > 0) {
          matchedTracks.push(res.songs[0]);
        }
      } catch (err) {
        console.warn(`Failed search for item "${q}":`, err);
      }
    }

    return NextResponse.json({
      success: true,
      tracks: matchedTracks,
      count: matchedTracks.length,
    });
  } catch (error: any) {
    console.error('API /api/import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
