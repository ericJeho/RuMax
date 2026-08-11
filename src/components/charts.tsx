'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Chart wrappers used across the three dashboards.
 *
 * Two rules are applied consistently:
 *  - Series colours come from a fixed, colour-blind-safe sequence rather than being
 *    picked per chart, so the same series means the same thing on every screen.
 *  - Every chart is paired by its caller with a table or figure elsewhere on the page;
 *    colour is never the only way to read a value.
 */

export const SERIES_COLORS = [
  '#2c3ea8', // brand blue
  '#ad7428', // academic gold
  '#1474a8', // info cyan
  '#167a4e', // success green
  '#8b5cf6', // violet
  '#be2830', // danger red
] as const;

const AXIS = { fontSize: 11, fill: 'currentColor', opacity: 0.65 } as const;

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ fill: 'currentColor', opacity: 0.06 }}
      contentStyle={{
        borderRadius: 12,
        border: '1px solid rgb(var(--rx-border))',
        background: 'rgb(var(--rx-surface))',
        color: 'rgb(var(--rx-fg))',
        fontSize: 12,
        boxShadow: '0 10px 30px -12px rgb(0 0 0 / 0.3)',
      }}
    />
  );
}

export type SeriesPoint = Record<string, string | number>;

export function TrendChart({
  data,
  xKey,
  series,
  height = 260,
  area = true,
}: {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
  area?: boolean;
}) {
  const Chart = area ? AreaChart : LineChart;

  return (
    <div className="text-muted" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s, i) =>
            area ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export function ColumnChart({
  data,
  xKey,
  series,
  height = 260,
  stacked = false,
}: {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
  stacked?: boolean;
}) {
  return (
    <div className="text-muted" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? 'stack' : undefined}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              radius={stacked ? 0 : [6, 6, 0, 0]}
              maxBarSize={44}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 240,
  centerLabel,
}: {
  data: { name: string; value: number }[];
  height?: number;
  centerLabel?: string;
}) {
  return (
    <div className="relative text-muted" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center pb-8">
          <span className="font-display text-2xl font-semibold text-fg">{centerLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export function CompetencyRadar({
  data,
  height = 260,
}: {
  data: { subject: string; score: number }[];
  height?: number;
}) {
  return (
    <div className="text-muted" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="currentColor" opacity={0.18} />
          <PolarAngleAxis dataKey="subject" tick={AXIS} />
          <Radar
            dataKey="score"
            stroke={SERIES_COLORS[0]}
            fill={SERIES_COLORS[0]}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <ChartTooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
