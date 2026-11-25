import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryMetrics } from '../../types/summary.ts';
import { formatINR, formatINRCompact } from '../../utils/currency.ts';

export interface CategoryBreakdownChartProps {
  items: CategoryMetrics[];
}

export function CategoryBreakdownChart({ items }: CategoryBreakdownChartProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-botanical-muted py-10 text-center">
        Add categories and expenses to view the spending breakdown.
      </p>
    );
  }

  const data = items.map((item) => ({
    name:
      item.category.name.length > 14
        ? `${item.category.name.slice(0, 13)}…`
        : item.category.name,
    fullName: item.category.name,
    Paid: item.totalPaid,
    Upcoming: item.totalUpcoming,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 16 }}>
          <CartesianGrid stroke="#D7C9B5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#626157', fontSize: 11 }}
            axisLine={{ stroke: '#D8C6A5' }}
            tickLine={false}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tickFormatter={(val: number) => formatINRCompact(val)}
            tick={{ fill: '#626157', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: '#F0E8D9', opacity: 0.45 }}
            contentStyle={{
              backgroundColor: '#FFFCF5',
              border: '1px solid #D8C6A5',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#1C1C19',
            }}
            formatter={(value) => formatINR(Number(value ?? 0))}
          />
          <Bar dataKey="Paid" stackId="spend" fill="#344A32" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Upcoming" stackId="spend" fill="#D8B978" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
