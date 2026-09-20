import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: 'Parameter id is required' }, { status: 400 });
    }

    const videoId = id.trim();
    const yt = await getInnertube();
    const info = await yt.music.getInfo(videoId);

    const basic = info.basic_info;
    const durationSec = basic.duration || 0;
    const title = basic.title || 'Unknown Title';
    const artist = basic.author || 'Unknown Artist';
    let coverUrl = '/default-album.png';
    if (basic.thumbnail) {
      if (Array.isArray(basic.thumbnail) && basic.thumbnail.length > 0) {
        coverUrl = (basic.thumbnail[basic.thumbnail.length - 1] as any)?.url || coverUrl;
      } else if ((basic.thumbnail as any).url) {
        coverUrl = (basic.thumbnail as any).url;
      }
    }

    // Return the proxy streaming audio URL so client browser streams smoothly with Range & CORS headers
    const streamUrl = `/api/stream/audio?id=${encodeURIComponent(videoId)}`;

    return NextResponse.json({
      url: streamUrl,
      videoId,
      title,
      artist,
      coverUrl,
      duration: durationSec,
      mimeType: 'audio/mp4',
    });
  } catch (error: any) {
    console.error('API /api/stream error for id:', req.nextUrl.searchParams.get('id'), error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve audio stream' },
      { status: 500 }
    );
  }
}
