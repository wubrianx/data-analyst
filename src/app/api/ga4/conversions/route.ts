import { NextRequest, NextResponse } from 'next/server';
import { getGA4Client } from '@/lib/data-sources';
import { parseDateParams } from '@/lib/utils/date-helpers';

export async function GET(request: NextRequest) {
  const dates = parseDateParams(request.nextUrl.searchParams);
  if (!dates) {
    return NextResponse.json({ error: 'Invalid date parameters' }, { status: 400 });
  }

  try {
    const client = await getGA4Client();
    const data = await client.getConversions(dates.start, dates.end);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] ga4/conversions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
