import { NextRequest, NextResponse } from 'next/server';
import { getMetaClient } from '@/lib/data-sources';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start') ?? '2025-01-01';
  const end = searchParams.get('end') ?? '2025-01-31';

  const client = await getMetaClient();
  const rawData = await client.getDemographics(start, end);

  // Aggregate by age group for bar chart
  const ageMap = new Map<string, { spend: number; conversions: number }>();
  for (const row of rawData) {
    const existing = ageMap.get(row.ageGroup) ?? { spend: 0, conversions: 0 };
    existing.spend += row.spend;
    existing.conversions += row.clicks; // use clicks as proxy if no conversions field
    ageMap.set(row.ageGroup, existing);
  }
  const ageGroups = Array.from(ageMap.entries()).map(([ageGroup, vals]) => ({
    ageGroup,
    spend: Math.round(vals.spend * 100) / 100,
    conversions: vals.conversions,
  }));

  // Build heatmap: age x gender CTR
  const ageLabels = [...new Set(rawData.map((r) => r.ageGroup))];
  const genderLabels = [...new Set(rawData.map((r) => r.gender))];
  const heatmapData: { x: string; y: string; value: number }[] = [];
  for (const row of rawData) {
    heatmapData.push({
      x: row.ageGroup,
      y: row.gender,
      value: Math.round(row.ctr * 10000) / 100, // convert decimal to percentage for display
    });
  }

  return NextResponse.json({
    ageGroups,
    ageGenderCtr: {
      data: heatmapData,
      xLabels: ageLabels,
      yLabels: genderLabels,
    },
  });
}
