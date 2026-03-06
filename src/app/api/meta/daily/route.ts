import { NextRequest, NextResponse } from 'next/server';
import { MockMeta } from '@/lib/data-sources/mock-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start') ?? '2025-01-01';
  const end = searchParams.get('end') ?? '2025-01-31';

  const data = MockMeta.getDailySpend(start, end);
  return NextResponse.json(data);
}
