import { NextRequest, NextResponse } from 'next/server';
import { getDirectAudioUrl, createProxiedRequest, isTorRunning } from '@/lib/stream-extractor';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || id.trim().length === 0) {
      return new NextResponse('Missing video ID', { status: 400 });
    }

    const videoId = id.trim();
    const rangeHeader = req.headers.get('range') || 'bytes=0-';

    const { url: streamUrl, mimeType } = await getDirectAudioUrl(videoId);
    const torActive = await isTorRunning();

    const upstream = await createProxiedRequest(streamUrl, rangeHeader, torActive);

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', (upstream.headers['content-type'] as string) || mimeType || 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Cache-Control', 'public, max-age=7200');

    if (upstream.headers['content-range']) {
      responseHeaders.set('Content-Range', upstream.headers['content-range'] as string);
    }
    if (upstream.headers['content-length']) {
      responseHeaders.set('Content-Length', upstream.headers['content-length'] as string);
    }

    // Convert Node incoming stream to Web ReadableStream
    const webStream = Readable.toWeb(upstream.stream) as ReadableStream;

    return new NextResponse(webStream, {
      status: upstream.statusCode === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Audio streaming proxy error:', error);
    return new NextResponse(error.message || 'Streaming failure', { status: 500 });
  }
}
