'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ChartData {
  type: 'BAR' | 'LINE' | 'PIE';
  title: string;
  data: { label: string; value: number }[];
}

const COLORS = ['#B7410E', '#2C3E50', '#64748B', '#E5E5E1', '#F59E0B'];

export default function ChartWidget({ chart }: { chart: ChartData }) {
  if (!chart || !chart.data) return null;

  return (
    <div className="my-10 p-6 bg-white border border-[#2C3E50]/10 rounded-sm shadow-sm">
      <h4 className="font-serif font-bold text-[#2C3E50] text-lg mb-2 uppercase tracking-wide border-b border-[#B7410E] inline-block pb-1">
        Data Insight: {chart.title}
      </h4>
      
      <div className="h-[300px] w-full mt-6 font-sans text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'PIE' ? (
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                // Fixed: Added default 0 to percent to satisfy strict null checks
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : chart.type === 'LINE' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2C3E50', color: '#fff', border: 'none' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#B7410E" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          ) : (
            // Default to BAR
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2C3E50', color: '#fff', border: 'none' }} 
                cursor={{fill: '#F5F5F1'}}
              />
              <Legend />
              <Bar dataKey="value" fill="#2C3E50" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[#64748B] mt-4 text-right italic">Source: Rusty Tablet Intelligence</p>
    </div>
  );
}