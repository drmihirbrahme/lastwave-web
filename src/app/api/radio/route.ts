import { NextRequest, NextResponse } from 'next/server';
import { getUpNextRadio } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: 'Parameter id is required' }, { status: 400 });
    }

    const tracks = await getUpNextRadio(id.trim());
    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('API /api/radio error for id:', req.nextUrl.searchParams.get('id'), error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve radio tracks' },
      { status: 500 }
    );
  }
}
