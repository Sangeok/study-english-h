"use client";

import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { PERIOD_OPTIONS, CATEGORY_LABELS } from "../config/chart-config";
import type { PeriodStatsResponse } from "@/features/dashboard";

// Premium Modern palette — teal(cobalt) · coral(ember) · gold(amber) · ocean · grape(slate)
const PIE_COLORS = ["#2E6BFF", "#F9701A", "#E8A23D", "#6E9BFF", "#3E5578"];

interface PeriodChartSectionProps {
  periodStats: PeriodStatsResponse | undefined;
  isLoading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

export function PeriodChartSection({
  periodStats, isLoading, period, onPeriodChange,
}: PeriodChartSectionProps) {
  return (
    <div>
      {/* 기간 선택 */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold border transition-colors",
              period === opt.value && "bg-teal border-teal-edge text-white",
              period !== opt.value &&
                "bg-paper border-border-warm text-ink-soft hover:bg-muted-warm hover:text-ink"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 일별 학습 시간 */}
        <div className="tactile-card p-6">
          <h3 className="text-lg font-display font-bold text-ink mb-4">일별 학습 시간</h3>
          {isLoading && (
            <div className="h-[250px] bg-muted-warm rounded-xl animate-pulse" />
          )}
          {!isLoading && periodStats && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={periodStats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.split("-")[2]}
                />
                <YAxis
                  label={{ value: "분", angle: -90, position: "insideLeft" }}
                  tickFormatter={(v: number) => String(Math.round(v / 60))}
                />
                <Tooltip
                  formatter={(value: number) => [`${Math.round(value / 60)}분`, "학습 시간"]}
                />
                <Line
                  type="monotone"
                  dataKey="totalStudyTimeSec"
                  stroke="#2E6BFF"
                  strokeWidth={3}
                  dot={{ fill: "#2E6BFF", r: 3 }}
                  name="학습 시간"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 신규 학습 어휘 카테고리 */}
        <div className="tactile-card p-6">
          <h3 className="text-lg font-display font-bold text-ink mb-4">신규 학습 어휘 카테고리</h3>
          <p className="text-xs text-ink-soft mb-3">기간 내 처음 추가된 어휘의 카테고리 분포</p>
          {isLoading && (
            <div className="h-[250px] bg-muted-warm rounded-xl animate-pulse" />
          )}
          {!isLoading && periodStats && periodStats.categoryStats.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={periodStats.categoryStats.map((c) => ({
                    ...c,
                    label: CATEGORY_LABELS[c.category] ?? c.category,
                  }))}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {periodStats.categoryStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!isLoading && periodStats && periodStats.categoryStats.length === 0 && (
            <p className="text-center text-ink-soft py-16">
              아직 학습한 어휘가 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
