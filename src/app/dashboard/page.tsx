"use client";

import { Suspense, useMemo } from "react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DualAxisChart, BarChart } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useFetch } from "@/lib/hooks/use-fetch";
import type { GaDailyTraffic, GaChannelGroup, MetaDailySpend } from "@/lib/data-sources/mock-data";

function DashboardContent() {
  const { startDate, endDate, setDateRange, queryString } = useDateRange();

  const { data: trafficData, loading: trafficLoading } = useFetch<GaDailyTraffic[]>(
    `/api/ga4/traffic?${queryString}`
  );
  const { data: channelsData, loading: channelsLoading } = useFetch<GaChannelGroup[]>(
    `/api/ga4/channels?${queryString}`
  );
  const { data: metaDaily, loading: metaLoading } = useFetch<MetaDailySpend[]>(
    `/api/meta/daily?${queryString}`
  );

  const loading = trafficLoading || channelsLoading || metaLoading;

  // Compute KPIs with deltas vs previous period
  const kpis = useMemo(() => {
    if (!trafficData || !metaDaily) return null;

    const totalSessions = trafficData.reduce((s, d) => s + d.sessions, 0);
    const totalActiveUsers = trafficData.reduce((s, d) => s + d.activeUsers, 0);
    const totalSpend = metaDaily.reduce((s, d) => s + d.spend, 0);
    const totalRevenue = metaDaily.reduce((s, d) => s + d.revenue, 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Simulate previous period delta (use first half vs second half as approximation)
    const mid = Math.floor(trafficData.length / 2);
    const firstHalfSessions = trafficData.slice(0, mid).reduce((s, d) => s + d.sessions, 0);
    const secondHalfSessions = trafficData.slice(mid).reduce((s, d) => s + d.sessions, 0);
    const sessionsDelta = firstHalfSessions > 0
      ? ((secondHalfSessions - firstHalfSessions) / firstHalfSessions) * 100
      : 0;

    const firstHalfUsers = trafficData.slice(0, mid).reduce((s, d) => s + d.activeUsers, 0);
    const secondHalfUsers = trafficData.slice(mid).reduce((s, d) => s + d.activeUsers, 0);
    const usersDelta = firstHalfUsers > 0
      ? ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100
      : 0;

    const metaMid = Math.floor(metaDaily.length / 2);
    const firstHalfSpend = metaDaily.slice(0, metaMid).reduce((s, d) => s + d.spend, 0);
    const secondHalfSpend = metaDaily.slice(metaMid).reduce((s, d) => s + d.spend, 0);
    const spendDelta = firstHalfSpend > 0
      ? ((secondHalfSpend - firstHalfSpend) / firstHalfSpend) * 100
      : 0;

    const firstHalfRevMeta = metaDaily.slice(0, metaMid).reduce((s, d) => s + d.revenue, 0);
    const firstHalfSpendMeta = metaDaily.slice(0, metaMid).reduce((s, d) => s + d.spend, 0);
    const secondHalfRevMeta = metaDaily.slice(metaMid).reduce((s, d) => s + d.revenue, 0);
    const secondHalfSpendMeta = metaDaily.slice(metaMid).reduce((s, d) => s + d.spend, 0);
    const firstRoas = firstHalfSpendMeta > 0 ? firstHalfRevMeta / firstHalfSpendMeta : 0;
    const secondRoas = secondHalfSpendMeta > 0 ? secondHalfRevMeta / secondHalfSpendMeta : 0;
    const roasDelta = firstRoas > 0
      ? ((secondRoas - firstRoas) / firstRoas) * 100
      : 0;

    return {
      sessions: { value: formatNumber(totalSessions), delta: sessionsDelta },
      activeUsers: { value: formatNumber(totalActiveUsers), delta: usersDelta },
      spend: { value: formatCurrency(totalSpend), delta: spendDelta },
      roas: { value: roas.toFixed(2), delta: roasDelta },
    };
  }, [trafficData, metaDaily]);

  // Merge GA traffic + Meta spend for dual axis chart
  const dualAxisData = useMemo(() => {
    if (!trafficData || !metaDaily) return [];
    const metaMap = new Map(metaDaily.map((d) => [d.date, d]));
    return trafficData.map((d) => ({
      date: d.date,
      sessions: d.sessions,
      spend: metaMap.get(d.date)?.spend ?? 0,
    }));
  }, [trafficData, metaDaily]);

  // Top 5 channels for bar chart
  const top5Channels = useMemo(() => {
    if (!channelsData) return [];
    return [...channelsData]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
  }, [channelsData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">{"Overview"}</h2>
        <DateFilter onChange={setDateRange} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          {"Loading..."}
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="GA Sessions"
              value={kpis?.sessions.value ?? "-"}
              delta={kpis?.sessions.delta}
            />
            <KpiCard
              title="GA Active Users"
              value={kpis?.activeUsers.value ?? "-"}
              delta={kpis?.activeUsers.delta}
            />
            <KpiCard
              title="Meta Ad Spend"
              value={kpis?.spend.value ?? "-"}
              delta={kpis?.spend.delta}
              inverse
            />
            <KpiCard
              title="Meta ROAS"
              value={kpis?.roas.value ?? "-"}
              delta={kpis?.roas.delta}
              suffix="x"
            />
          </div>

          {/* Dual Axis Chart: Sessions vs Spend */}
          <Card>
            <CardHeader>
              <CardTitle>{"GA Sessions vs Meta Spend"}</CardTitle>
            </CardHeader>
            <CardContent>
              <DualAxisChart
                data={dualAxisData}
                xKey="date"
                leftLine={{ key: "sessions", name: "Sessions", color: "#6366f1" }}
                rightLine={{ key: "spend", name: "Spend (NT$)", color: "#f59e0b" }}
              />
            </CardContent>
          </Card>

          {/* Top 5 Channels */}
          <Card>
            <CardHeader>
              <CardTitle>{"Top 5 Traffic Channels"}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={top5Channels}
                xKey="channel"
                bars={[
                  { key: "sessions", name: "Sessions", color: "#6366f1" },
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardHome() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">{"Loading..."}</div>}>
      <DashboardContent />
    </Suspense>
  );
}
