import { NextRequest, NextResponse } from 'next/server';
import { getAudioStream } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: 'Parameter id is required' }, { status: 400 });
    }

    const streamData = await getAudioStream(id.trim());
    return NextResponse.json(streamData);
  } catch (error: any) {
    console.error('API /api/stream error for id:', req.nextUrl.searchParams.get('id'), error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve audio stream' },
      { status: 500 }
    );
  }
}
