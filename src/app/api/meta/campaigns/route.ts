import { NextRequest, NextResponse } from 'next/server';
import { getMetaClient } from '@/lib/data-sources';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start') ?? '2025-01-01';
  const end = searchParams.get('end') ?? '2025-01-31';

  const client = await getMetaClient();
  const data = await client.getCampaigns(start, end);
  return NextResponse.json(data);
}
