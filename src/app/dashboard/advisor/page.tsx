"use client";

import { Suspense, useState, useCallback } from "react";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useFetch } from "@/lib/hooks/use-fetch";
import { DateFilter } from "@/components/dashboard/date-filter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Finding {
  category: "anomaly" | "health" | "sanity" | "recommendation";
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  description: string;
  suggestion?: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  positive: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "嚴重",
  warning: "警告",
  info: "資訊",
  positive: "正向",
};

const CATEGORY_LABELS: Record<string, string> = {
  anomaly: "異常偵測",
  health: "健康度檢查",
  sanity: "合理性檢查",
  recommendation: "建議",
};

function AdvisorContent() {
  const { startDate, endDate, setDateRange, queryString } = useDateRange();

  const { data: gaData, loading: loadingGa } = useFetch<any>(
    `/api/ga4/traffic?${queryString}`
  );
  const { data: metaData, loading: loadingMeta } = useFetch<any>(
    `/api/meta/daily?${queryString}`
  );

  const [findings, setFindings] = useState<Finding[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setAnalyzed(false);
    try {
      const res = await fetch("/api/advisor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          gaData,
          metaData,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const sorted = (result.findings ?? []).sort(
        (a: Finding, b: Finding) =>
          (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      );
      setFindings(sorted);
      setAnalyzed(true);
    } catch {
      setFindings([]);
      setAnalyzed(true);
    } finally {
      setAnalyzing(false);
    }
  }, [startDate, endDate, gaData, metaData]);

  const loading = loadingGa || loadingMeta;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        載入中...
      </div>
    );
  }

  // Group findings by category
  const grouped = findings.reduce<Record<string, Finding[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">行銷顧問</h1>
        <DateFilter onChange={setDateRange} />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? "分析中..." : "執行分析"}
        </Button>
        <div className="relative group">
          <Button variant="outline" disabled>
            AI 深度分析
          </Button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            需要設定 Anthropic API Key
          </div>
        </div>
      </div>

      {analyzed && findings.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              分析完成，目前無發現。請確認已正確串接 API 資料。
            </p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          {items.map((finding, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={SEVERITY_STYLES[finding.severity]}
                    variant="outline"
                  >
                    {SEVERITY_LABELS[finding.severity] ?? finding.severity}
                  </Badge>
                  <h3 className="font-medium">{finding.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {finding.description}
                </p>
                {finding.suggestion && (
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-sm">{finding.suggestion}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdvisorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">載入中...</div>}>
      <AdvisorContent />
    </Suspense>
  );
}
