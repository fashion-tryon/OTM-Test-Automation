import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-800 mb-1">{d.label}</div>
      <div className="text-emerald-600 font-bold">{d.pass_rate}% pass rate</div>
      <div className="text-slate-400 text-xs mt-1">
        {d.passed} passed · {d.failed} failed · {d.total_tests} total
      </div>
    </div>
  );
}

export default function PassRateChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No completed runs yet
      </div>
    );
  }

  const chartData = data.map(r => ({
    ...r,
    label:     'Run #' + r.id,
    pass_rate: parseFloat(r.pass_rate),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          unit="%"
          width={38}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
        <Line
          type="monotone"
          dataKey="pass_rate"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#16a34a' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
