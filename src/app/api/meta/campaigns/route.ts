import { NextRequest, NextResponse } from 'next/server';
import { getMetaClient } from '@/lib/data-sources';
import { parseDateParams } from '@/lib/utils/date-helpers';

export async function GET(request: NextRequest) {
  const dates = parseDateParams(request.nextUrl.searchParams);
  if (!dates) {
    return NextResponse.json({ error: 'Invalid date parameters' }, { status: 400 });
  }

  try {
    const client = await getMetaClient();
    const data = await client.getCampaigns(dates.start, dates.end);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] meta/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
