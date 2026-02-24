import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ViewTimeline({ data }: { data: any }) {
  if (!data || data.length === 0) {
    return <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center text-neutral-400 font-medium shadow-sm">No view data yet</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 mb-6 tracking-tight">Views Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#737373', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373', fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
          <Tooltip 
            cursor={{ fill: '#f5f5f5' }} 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
          />
          {/* Strict Solid Color */}
          <Bar dataKey="count" fill="#171717" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
