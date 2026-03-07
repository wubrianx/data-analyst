"use client";

import { Suspense, useMemo } from "react";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  mergeGaMetaDaily,
  calculateCorrelation,
  addWeekday,
} from "@/lib/utils/data-processing";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import {
  DualAxisChart,
  ScatterChart,
  BarChart,
} from "@/components/charts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function CrossAnalysisContent() {
  const { startDate, endDate, setDateRange, queryString } = useDateRange();

  const { data: gaTraffic, loading: loadingGa } = useFetch<any[]>(
    `/api/ga4/traffic?${queryString}`
  );
  const { data: gaChannels, loading: loadingChannels } = useFetch<any[]>(
    `/api/ga4/channels?${queryString}`
  );
  const { data: metaDaily, loading: loadingMeta } = useFetch<any[]>(
    `/api/meta/daily?${queryString}`
  );

  // Merge GA + Meta daily data
  const merged = useMemo(() => {
    if (!gaTraffic || !metaDaily) return [];
    return mergeGaMetaDaily(gaTraffic, metaDaily);
  }, [gaTraffic, metaDaily]);

  // Pearson correlation: spend vs sessions
  const correlation = useMemo(() => {
    if (merged.length < 2) return 0;
    const x = merged.map((d) => d.spend ?? 0);
    const y = merged.map((d) => d.sessions ?? 0);
    return calculateCorrelation(x, y);
  }, [merged]);

  // Cross-platform CPA: Meta Spend / GA Conversions
  const crossCpa = useMemo(() => {
    const totalSpend = merged.reduce((s, d) => s + (d.spend ?? 0), 0);
    const totalConversions = merged.reduce((s, d) => s + (d.conversions ?? 0), 0);
    if (totalConversions === 0) return 0;
    return totalSpend / totalConversions;
  }, [merged]);

  // Weekday analysis
  const weekdayData = useMemo(() => {
    if (merged.length === 0) return [];
    const withWeekday = addWeekday(merged);

    const groups: Record<
      number,
      { label: string; spendSum: number; sessionsSum: number; count: number }
    > = {};

    for (const row of withWeekday) {
      if (!groups[row.weekday]) {
        groups[row.weekday] = {
          label: `週${row.weekdayLabel}`,
          spendSum: 0,
          sessionsSum: 0,
          count: 0,
        };
      }
      const g = groups[row.weekday];
      g.spendSum += row.spend ?? 0;
      g.sessionsSum += row.sessions ?? 0;
      g.count += 1;
    }

    // Order: Monday(1) to Sunday(0)
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order
      .filter((w) => groups[w])
      .map((w) => {
        const g = groups[w];
        return {
          weekday: g.label,
          avgSpend: g.count > 0 ? Math.round(g.spendSum / g.count) : 0,
          avgSessions: g.count > 0 ? Math.round(g.sessionsSum / g.count) : 0,
        };
      });
  }, [merged]);

  const loading = loadingGa || loadingChannels || loadingMeta;

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
        <h1 className="text-2xl font-bold">交叉分析</h1>
        <DateFilter onChange={setDateRange} />
      </div>

      {/* DualAxisChart: Meta spend vs GA sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Meta 花費 vs GA 工作階段</CardTitle>
        </CardHeader>
        <CardContent>
          <DualAxisChart
            data={merged}
            xKey="date"
            leftLine={{ key: "spend", name: "Meta 花費 (NT$)", color: "#6366f1" }}
            rightLine={{ key: "sessions", name: "GA 工作階段", color: "#10b981" }}
          />
        </CardContent>
      </Card>

      {/* ScatterChart: spend vs sessions with trend line */}
      <Card>
        <CardHeader>
          <CardTitle>花費 vs 工作階段散佈圖</CardTitle>
        </CardHeader>
        <CardContent>
          <ScatterChart
            data={merged}
            xKey="spend"
            yKey="sessions"
            xName="Meta 花費 (NT$)"
            yName="GA 工作階段"
            showTrendLine
          />
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          title="Pearson 相關係數 (花費 vs 工作階段)"
          value={correlation.toFixed(4)}
        />
        <KpiCard
          title="跨平台 CPA (Meta 花費 / GA 轉換)"
          value={formatCurrency(crossCpa)}
        />
      </div>

      {/* GA Channel Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>GA 流量管道歸因</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={gaChannels ?? []}
            xKey="channel"
            bars={[
              { key: "sessions", name: "工作階段", color: "#6366f1" },
              { key: "conversions", name: "轉換", color: "#10b981" },
            ]}
          />
        </CardContent>
      </Card>

      {/* Weekday Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>星期分析 (日均指標)</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={weekdayData}
            xKey="weekday"
            bars={[
              { key: "avgSpend", name: "平均花費", color: "#6366f1" },
              { key: "avgSessions", name: "平均工作階段", color: "#10b981" },
            ]}
          />
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>注意：</strong>
            Google Analytics 與 Meta 使用不同的歸因模型。GA4 預設使用
            「資料驅動歸因」，而 Meta 使用「7 天點擊 / 1 天瀏覽」歸因。因此，兩個平台的轉換數據可能存在差異，交叉比較時請留意此差異。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrossAnalysisPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">載入中...</div>}>
      <CrossAnalysisContent />
    </Suspense>
  );
}
