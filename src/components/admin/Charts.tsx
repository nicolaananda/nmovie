interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  /** Optional unit suffix shown in the tooltip-style number bubbles. */
  unit?: string;
  /** Bar color (Tailwind class on the rect). Defaults to primary. */
  color?: string;
  height?: number;
  /** Number of decimals for displayed values. */
  decimals?: number;
}

/**
 * Tiny dependency-free SVG bar chart. Designed for the admin dashboard's
 * 7-day windows where we want a glanceable trend without pulling in a
 * 50KB+ chart library.
 */
export function BarChart({
  data,
  unit = '',
  color = 'fill-primary-500',
  height = 160,
  decimals = 0,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-500">No data</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, idx) => {
          const h = (d.value / max) * (height - 24);
          const x = idx * barWidth;
          const y = height - 16 - h;
          return (
            <g key={`${d.label}-${idx}`}>
              <rect
                x={x + barWidth * 0.15}
                y={y}
                width={barWidth * 0.7}
                height={Math.max(1, h)}
                rx={1.5}
                className={color}
                opacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={y - 2}
                textAnchor="middle"
                className="fill-white font-bold"
                style={{ fontSize: 5 }}
              >
                {d.value > 0 ? `${d.value.toFixed(decimals)}${unit}` : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-gray-500 uppercase tracking-wider"
                style={{ fontSize: 4.5 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface HorizontalBarItem {
  label: string;
  value: number;
  sub?: string;
}

interface HorizontalBarsProps {
  data: HorizontalBarItem[];
  unit?: string;
}

/**
 * Compact horizontal bar list for "top N" rankings (most watched titles).
 * The first item gets the strongest color, fading down the list.
 */
export function HorizontalBars({ data, unit = '' }: HorizontalBarsProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-500">No data</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((d, idx) => {
        const pct = (d.value / max) * 100;
        const opacity = 1 - idx * 0.07;
        return (
          <div key={`${d.label}-${idx}`} className="flex items-center gap-3 text-xs">
            <div className="w-5 shrink-0 text-gray-500 tabular-nums">{idx + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium truncate" title={d.label}>
                  {d.label}
                </span>
                <span className="text-gray-400 tabular-nums shrink-0 ml-2">
                  {d.value}{unit}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-[width]"
                  style={{ width: `${pct}%`, opacity }}
                />
              </div>
              {d.sub && <div className="text-[10px] text-gray-600 mt-0.5">{d.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
