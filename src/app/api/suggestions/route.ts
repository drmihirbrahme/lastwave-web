import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await getSearchSuggestions(query.trim());
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('API /api/suggestions error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
