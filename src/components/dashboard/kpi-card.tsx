"use client";

import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  inverse?: boolean;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  delta,
  inverse = false,
  prefix,
  suffix,
  icon,
}: KpiCardProps) {
  const isPositiveDelta = delta !== undefined && delta >= 0;
  const isGood = inverse ? !isPositiveDelta : isPositiveDelta;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon && (
            <span className="text-muted-foreground">{icon}</span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </span>
          {delta !== undefined && (
            <Badge
              variant="secondary"
              className={cn(
                "gap-0.5 text-xs font-medium",
                isGood
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {isPositiveDelta ? (
                <ArrowUpIcon className="size-3" />
              ) : (
                <ArrowDownIcon className="size-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
