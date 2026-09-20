import { NextRequest, NextResponse } from 'next/server';
import {
  updateNowPlaying,
  scrobbleTrack,
  getUserRecentTracks,
  getUserTopArtists,
  getUserFriends,
} from '@/lib/lastfm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, config, track } = body;

    if (action === 'nowplaying') {
      const success = await updateNowPlaying(config, track);
      return NextResponse.json({ success });
    }

    if (action === 'scrobble') {
      const success = await scrobbleTrack(config, track);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/lastfm POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const user = searchParams.get('user');
    const apiKey = searchParams.get('apiKey') || undefined;

    if (!user) {
      return NextResponse.json({ error: 'User parameter is required' }, { status: 400 });
    }

    if (action === 'recent') {
      const tracks = await getUserRecentTracks(user, apiKey);
      return NextResponse.json({ tracks });
    }

    if (action === 'topartists') {
      const period = (searchParams.get('period') as any) || '1month';
      const artists = await getUserTopArtists(user, apiKey, period);
      return NextResponse.json({ artists });
    }

    if (action === 'friends') {
      const friends = await getUserFriends(user, apiKey);
      return NextResponse.json({ friends });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/lastfm GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
