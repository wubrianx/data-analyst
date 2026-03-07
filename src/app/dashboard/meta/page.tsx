"use client";

import { Suspense, useMemo } from "react";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils/formatters";
import { TrendChart, BarChart, DonutChart, ScatterChart, HeatmapChart } from "@/components/charts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function MetaAdsContent() {
  const { startDate, endDate, setDateRange, queryString } = useDateRange();

  const { data: campaigns, loading: loadingCampaigns } = useFetch<any[]>(
    `/api/meta/campaigns?${queryString}`
  );
  const { data: adsets, loading: loadingAdsets } = useFetch<any[]>(
    `/api/meta/adsets?${queryString}`
  );
  const { data: ads, loading: loadingAds } = useFetch<any[]>(
    `/api/meta/ads?${queryString}`
  );
  const { data: daily, loading: loadingDaily } = useFetch<any[]>(
    `/api/meta/daily?${queryString}`
  );
  const { data: demographics, loading: loadingDemographics } = useFetch<any>(
    `/api/meta/demographics?${queryString}`
  );
  const { data: platforms, loading: loadingPlatforms } = useFetch<any[]>(
    `/api/meta/platforms?${queryString}`
  );
  const { data: roasData, loading: loadingRoas } = useFetch<any[]>(
    `/api/meta/roas?${queryString}`
  );

  // Tab 1: Campaign overview data
  const campaignSpendDonut = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.map((c: any) => ({
      name: c.name,
      value: c.spend ?? 0,
    }));
  }, [campaigns]);

  // Tab 3: Top 10 ads by spend
  const top10AdsBySpend = useMemo(() => {
    if (!ads) return [];
    return [...ads]
      .sort((a: any, b: any) => (b.spend ?? 0) - (a.spend ?? 0))
      .slice(0, 10);
  }, [ads]);

  const topRoasAds = useMemo(() => {
    if (!ads) return [];
    return [...ads]
      .filter((a: any) => a.roas != null && a.roas > 0)
      .sort((a: any, b: any) => (b.roas ?? 0) - (a.roas ?? 0))
      .slice(0, 10);
  }, [ads]);

  // Tab 4: Spend analysis
  const spendKpis = useMemo(() => {
    if (!daily || daily.length === 0) return { total: 0, avg: 0, days: 0 };
    const total = daily.reduce((sum: number, d: any) => sum + (d.spend ?? 0), 0);
    return {
      total,
      avg: total / daily.length,
      days: daily.length,
    };
  }, [daily]);

  const platformDonut = useMemo(() => {
    if (!platforms) return [];
    return platforms.map((p: any) => ({
      name: p.name ?? p.platform,
      value: p.spend ?? p.value ?? 0,
    }));
  }, [platforms]);

  // Tab 5: Performance KPIs
  const perfKpis = useMemo(() => {
    if (!daily || daily.length === 0)
      return { avgRoas: 0, avgCpc: 0, avgCtr: 0 };
    const totalSpend = daily.reduce((s: number, d: any) => s + (d.spend ?? 0), 0);
    const totalRevenue = daily.reduce((s: number, d: any) => s + (d.revenue ?? 0), 0);
    const totalClicks = daily.reduce((s: number, d: any) => s + (d.clicks ?? 0), 0);
    const totalImpressions = daily.reduce((s: number, d: any) => s + (d.impressions ?? 0), 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    return { avgRoas, avgCpc, avgCtr };
  }, [daily]);

  // Tab 6: Demographics
  const ageGroupData = useMemo(() => {
    if (!demographics?.ageGroups) return [];
    return demographics.ageGroups;
  }, [demographics]);

  const heatmapData = useMemo(() => {
    if (!demographics?.ageGenderCtr) return { data: [], xLabels: [], yLabels: [] };
    return demographics.ageGenderCtr;
  }, [demographics]);

  const loading =
    loadingCampaigns ||
    loadingAdsets ||
    loadingAds ||
    loadingDaily ||
    loadingDemographics ||
    loadingPlatforms ||
    loadingRoas;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        載入中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meta 廣告分析</h1>
        <DateFilter onChange={setDateRange} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">廣告活動概覽</TabsTrigger>
          <TabsTrigger value="adsets">廣告組分析</TabsTrigger>
          <TabsTrigger value="ads">個別廣告</TabsTrigger>
          <TabsTrigger value="spend">花費分析</TabsTrigger>
          <TabsTrigger value="performance">成效指標</TabsTrigger>
          <TabsTrigger value="audience">受眾分析</TabsTrigger>
        </TabsList>

        {/* Tab 1: 廣告活動概覽 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>廣告活動成效</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">名稱</th>
                      <th className="pb-2 pr-4 font-medium text-right">花費</th>
                      <th className="pb-2 pr-4 font-medium text-right">曝光</th>
                      <th className="pb-2 pr-4 font-medium text-right">CTR</th>
                      <th className="pb-2 pr-4 font-medium text-right">CPC</th>
                      <th className="pb-2 pr-4 font-medium text-right">轉換</th>
                      <th className="pb-2 font-medium text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(campaigns ?? []).map((c: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{c.name}</td>
                        <td className="py-2 pr-4 text-right">
                          {formatCurrency(c.spend ?? 0)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {formatNumber(c.impressions ?? 0)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {formatPercentage(c.ctr ?? 0)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {formatCurrency(c.cpc ?? 0)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {formatNumber(c.conversions ?? 0)}
                        </td>
                        <td className="py-2 text-right">
                          {(c.roas ?? 0).toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>花費分佈 (依廣告活動)</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={campaignSpendDonut} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 廣告組分析 */}
        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>廣告組成效比較</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={adsets ?? []}
                xKey="name"
                bars={[
                  { key: "spend", name: "花費", color: "#6366f1" },
                  { key: "conversions", name: "轉換", color: "#10b981" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CPC vs CTR 散佈圖</CardTitle>
            </CardHeader>
            <CardContent>
              <ScatterChart
                data={adsets ?? []}
                xKey="cpc"
                yKey="ctr"
                xName="CPC (NT$)"
                yName="CTR"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: 個別廣告 */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>花費前 10 名廣告</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={top10AdsBySpend}
                xKey="name"
                bars={[{ key: "spend", name: "花費", color: "#6366f1" }]}
                layout="vertical"
                height={400}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROAS 最佳廣告</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRoasAds.map((ad: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b last:border-0 pb-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{ad.name}</p>
                      <p className="text-xs text-muted-foreground">
                        花費: {formatCurrency(ad.spend ?? 0)}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">
                      {(ad.roas ?? 0).toFixed(2)}x
                    </span>
                  </div>
                ))}
                {topRoasAds.length === 0 && (
                  <p className="text-sm text-muted-foreground">尚無資料</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: 花費分析 */}
        <TabsContent value="spend" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              title="總花費"
              value={formatCurrency(spendKpis.total)}
            />
            <KpiCard
              title="日均花費"
              value={formatCurrency(spendKpis.avg)}
            />
            <KpiCard
              title="統計天數"
              value={spendKpis.days}
              suffix=" 天"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>每日花費趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={daily ?? []}
                xKey="date"
                lines={[{ key: "spend", name: "花費", color: "#6366f1" }]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平台花費分佈</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={platformDonut} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: 成效指標 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="平均 ROAS" value={perfKpis.avgRoas.toFixed(2)} suffix="x" />
            <KpiCard
              title="平均 CPC"
              value={formatCurrency(perfKpis.avgCpc)}
              inverse
            />
            <KpiCard
              title="平均 CTR"
              value={formatPercentage(perfKpis.avgCtr)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>每日 ROAS / CPC / CTR 趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={daily ?? []}
                xKey="date"
                lines={[
                  { key: "roas", name: "ROAS", color: "#10b981" },
                  { key: "cpc", name: "CPC", color: "#f59e0b" },
                  { key: "ctr", name: "CTR", color: "#6366f1" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: 受眾分析 */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>年齡層成效</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={ageGroupData}
                xKey="ageGroup"
                bars={[
                  { key: "spend", name: "花費", color: "#6366f1" },
                  { key: "conversions", name: "轉換", color: "#10b981" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>年齡 x 性別 CTR 熱力圖</CardTitle>
            </CardHeader>
            <CardContent>
              <HeatmapChart
                data={heatmapData.data ?? []}
                xLabels={heatmapData.xLabels ?? []}
                yLabels={heatmapData.yLabels ?? []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平台分佈</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={platformDonut} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MetaAdsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">載入中...</div>}>
      <MetaAdsContent />
    </Suspense>
  );
}
