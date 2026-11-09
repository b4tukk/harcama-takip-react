import { colorOf, categoryLabel } from '../lib/categories'
import { formatDate, formatTL } from '../lib/format'

export function Badge({ category }) {
  const [bg, fg] = colorOf(category)
  return <span className="badge" style={{ background: bg, color: fg }}>{categoryLabel(category)}</span>
}

export default function TransactionTable({ items, onEdit, onDelete }) {
  if (items.length === 0) return <p className="empty">Gösterilecek işlem yok.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Tarih</th><th>Açıklama</th><th>Kategori</th><th className="num">Tutar</th><th aria-label="İşlemler" /></tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>{formatDate(t.date)}</td>
              <td>{t.title}</td>
              <td><Badge category={t.category} /></td>
              <td className={`num ${t.type}`}>{t.type === 'income' ? '+' : '−'}{formatTL(t.amount)}</td>
              <td className="row-actions">
                <button className="ghost" onClick={() => onEdit(t)} aria-label={`${t.title} işlemini düzenle`}>Düzenle</button>
                <button className="ghost danger" onClick={() => onDelete(t.id)} aria-label={`${t.title} işlemini sil`}>Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
