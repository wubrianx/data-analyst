"use client";

import { Suspense, useMemo } from "react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TrendChart, BarChart, DonutChart } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils/formatters";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useFetch } from "@/lib/hooks/use-fetch";
import type {
  GaDailyTraffic,
  GaTopPage,
  GaDemographics,
  GaConversion,
  GaTrafficSource,
  GaChannelGroup,
} from "@/lib/data-sources/mock-data";

function GaContent() {
  const { startDate, endDate, setDateRange, queryString } = useDateRange();

  const { data: trafficData, loading: l1 } = useFetch<GaDailyTraffic[]>(
    `/api/ga4/traffic?${queryString}`
  );
  const { data: pagesData, loading: l2 } = useFetch<GaTopPage[]>(
    `/api/ga4/pages?${queryString}`
  );
  const { data: demoData, loading: l3 } = useFetch<GaDemographics>(
    `/api/ga4/demographics?${queryString}`
  );
  const { data: convData, loading: l4 } = useFetch<GaConversion[]>(
    `/api/ga4/conversions?${queryString}`
  );
  const { data: sourcesData, loading: l5 } = useFetch<GaTrafficSource[]>(
    `/api/ga4/sources?${queryString}`
  );
  const { data: channelsData, loading: l6 } = useFetch<GaChannelGroup[]>(
    `/api/ga4/channels?${queryString}`
  );

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  // ---- Tab 1: Traffic trends ----
  const trafficTrend = useMemo(() => trafficData ?? [], [trafficData]);

  // ---- Tab 2: User behavior ----
  const top20Pages = useMemo(() => {
    if (!pagesData) return [];
    return [...pagesData].sort((a, b) => b.pageViews - a.pageViews).slice(0, 20);
  }, [pagesData]);

  const deviceDonut = useMemo(() => {
    if (!demoData) return [];
    return demoData.devices.map((d) => ({ name: d.device, value: d.sessions }));
  }, [demoData]);

  const countryBar = useMemo(() => {
    if (!demoData) return [];
    return [...demoData.countries].sort((a, b) => b.sessions - a.sessions);
  }, [demoData]);

  // ---- Tab 3: Conversions ----
  const dailyConversions = useMemo(() => {
    if (!convData) return [];
    // Aggregate by date: sum purchase conversions and revenue
    const map = new Map<string, { date: string; conversions: number; revenue: number }>();
    for (const row of convData) {
      if (row.eventName !== "purchase") continue;
      const existing = map.get(row.date);
      if (existing) {
        existing.conversions += row.conversions;
        existing.revenue += row.revenue;
      } else {
        map.set(row.date, { date: row.date, conversions: row.conversions, revenue: row.revenue });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [convData]);

  const conversionKpis = useMemo(() => {
    if (!dailyConversions.length || !trafficData) return null;
    const totalRevenue = dailyConversions.reduce((s, d) => s + d.revenue, 0);
    const totalPurchases = dailyConversions.reduce((s, d) => s + d.conversions, 0);
    const totalSessions = trafficData.reduce((s, d) => s + d.sessions, 0);
    const conversionRate = totalSessions > 0 ? totalPurchases / totalSessions : 0;
    return { totalRevenue, totalPurchases, conversionRate };
  }, [dailyConversions, trafficData]);

  // ---- Tab 4: Traffic sources ----
  const channelBreakdown = useMemo(() => {
    if (!channelsData) return [];
    return [...channelsData].sort((a, b) => b.sessions - a.sessions);
  }, [channelsData]);

  const top5SourceTrends = useMemo(() => {
    if (!sourcesData) return [];
    // Find top 5 sources by total sessions
    const sourceMap = new Map<string, number>();
    for (const row of sourcesData) {
      const key = `${row.source} / ${row.medium}`;
      sourceMap.set(key, (sourceMap.get(key) ?? 0) + row.sessions);
    }
    const topSources = [...sourceMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key);

    // Group by date
    const dateMap = new Map<string, Record<string, string | number>>();
    for (const row of sourcesData) {
      const key = `${row.source} / ${row.medium}`;
      if (!topSources.includes(key)) continue;
      if (!dateMap.has(row.date)) dateMap.set(row.date, { date: row.date });
      const entry = dateMap.get(row.date)!;
      entry[key] = ((entry[key] as number) ?? 0) + row.sessions;
    }

    return {
      data: Array.from(dateMap.values()).sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      ),
      sources: topSources,
    };
  }, [sourcesData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">{"GA \u5206\u6790"}</h2>
        <DateFilter onChange={setDateRange} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          {"\u8F09\u5165\u4E2D..."}
        </div>
      ) : (
        <Tabs defaultValue="traffic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="traffic">{"\u6D41\u91CF\u5206\u6790"}</TabsTrigger>
            <TabsTrigger value="behavior">{"\u4F7F\u7528\u8005\u884C\u70BA"}</TabsTrigger>
            <TabsTrigger value="conversions">{"\u8F49\u63DB\u8FFD\u8E64"}</TabsTrigger>
            <TabsTrigger value="sources">{"\u6D41\u91CF\u4F86\u6E90"}</TabsTrigger>
          </TabsList>

          {/* Tab 1: Traffic Analysis */}
          <TabsContent value="traffic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{"\u6BCF\u65E5 Sessions & Active Users"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  data={trafficTrend}
                  lines={[
                    { key: "sessions", name: "Sessions", color: "#6366f1" },
                    { key: "activeUsers", name: "Active Users", color: "#10b981" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{"Bounce Rate & Engagement Rate"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  data={trafficTrend.map((d) => ({
                    date: d.date,
                    bounceRate: +(d.bounceRate * 100).toFixed(1),
                    engagementRate: +(d.engagementRate * 100).toFixed(1),
                  }))}
                  lines={[
                    { key: "bounceRate", name: "Bounce Rate (%)", color: "#ef4444" },
                    { key: "engagementRate", name: "Engagement Rate (%)", color: "#10b981" },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: User Behavior */}
          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{"Top 20 \u9801\u9762 (by Page Views)"}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={top20Pages.map((p) => ({
                    page: p.pageTitle,
                    pageViews: p.pageViews,
                  }))}
                  xKey="page"
                  bars={[{ key: "pageViews", name: "Page Views", color: "#6366f1" }]}
                  layout="vertical"
                  height={500}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{"\u88DD\u7F6E\u985E\u578B\u5206\u4F48"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={deviceDonut} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{"\u570B\u5BB6/\u5730\u5340"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={countryBar}
                    xKey="country"
                    bars={[{ key: "sessions", name: "Sessions", color: "#8b5cf6" }]}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Conversion Tracking */}
          <TabsContent value="conversions" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                title={"\u7E3D\u71DF\u6536"}
                value={conversionKpis ? formatCurrency(conversionKpis.totalRevenue) : "-"}
              />
              <KpiCard
                title={"\u8CFC\u8CB7\u6B21\u6578"}
                value={conversionKpis ? formatNumber(conversionKpis.totalPurchases) : "-"}
              />
              <KpiCard
                title={"\u8F49\u63DB\u7387"}
                value={conversionKpis ? formatPercentage(conversionKpis.conversionRate) : "-"}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{"\u6BCF\u65E5\u8F49\u63DB & \u71DF\u6536"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  data={dailyConversions}
                  lines={[
                    { key: "conversions", name: "Conversions", color: "#6366f1" },
                    { key: "revenue", name: "Revenue (NT$)", color: "#f59e0b" },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Traffic Sources */}
          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{"Channel Group Breakdown"}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={channelBreakdown}
                  xKey="channel"
                  bars={[
                    { key: "sessions", name: "Sessions", color: "#6366f1" },
                    { key: "conversions", name: "Conversions", color: "#10b981" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{"Top 5 Source/Medium \u6BCF\u65E5\u8D8B\u52E2"}</CardTitle>
              </CardHeader>
              <CardContent>
                {top5SourceTrends && "data" in top5SourceTrends ? (
                  <TrendChart
                    data={top5SourceTrends.data}
                    lines={top5SourceTrends.sources.map((src, i) => ({
                      key: src,
                      name: src,
                    }))}
                  />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function GaAnalysisPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">{"\u8F09\u5165\u4E2D..."}</div>}>
      <GaContent />
    </Suspense>
  );
}
