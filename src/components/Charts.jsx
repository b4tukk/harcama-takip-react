import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { colorOf } from '../lib/categories'
import { formatTL } from '../lib/format'

export function MonthlyChart({ data }) {
  return (
    <div className="chart" role="img" aria-label="Son 6 ayın gelir ve gider grafiği">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="ay" stroke="var(--muted)" />
          <YAxis stroke="var(--muted)" tickFormatter={(v) => `${Math.round(v / 1000)}b`} width={40} />
          <Tooltip formatter={(v) => formatTL(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
          <Legend />
          <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryChart({ data }) {
  if (data.length === 0) return <p className="empty">Bu ay gider yok.</p>
  return (
    <div className="chart" role="img" aria-label="Kategorilere göre gider dağılımı">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={colorOf(d.name)[2]} />)}
          </Pie>
          <Tooltip formatter={(v) => formatTL(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
