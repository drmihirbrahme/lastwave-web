import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || id.trim().length === 0) {
      return new NextResponse('Missing video ID', { status: 400 });
    }

    const rangeHeader = req.headers.get('range') || 'bytes=0-';

    const yt = await getInnertube();
    const info = await yt.music.getInfo(id.trim());

    const format = await info.chooseFormat({
      type: 'audio',
      quality: 'best',
    });

    if (!format) {
      return new NextResponse('Audio format not found', { status: 404 });
    }

    let directUrl = format.url;
    if (!directUrl && format.decipher) {
      directUrl = await format.decipher(yt.session.player);
    }

    if (!directUrl) {
      return new NextResponse('Failed to resolve deciphered audio URL', { status: 500 });
    }

    // Forward range request to Google Video CDN
    const upstreamRes = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': rangeHeader,
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      },
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      console.error('Upstream audio fetch failed:', upstreamRes.status, upstreamRes.statusText);
      return new NextResponse('Upstream audio fetch error', { status: upstreamRes.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', upstreamRes.headers.get('content-type') || 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const contentRange = upstreamRes.headers.get('content-range');
    const contentLength = upstreamRes.headers.get('content-length');

    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Audio streaming proxy error:', error);
    return new NextResponse(error.message || 'Streaming proxy failure', { status: 500 });
  }
}
