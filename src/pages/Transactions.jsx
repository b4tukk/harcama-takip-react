import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { filterTransactions } from '../lib/selectors'
import { ALL_CATEGORIES, categoryLabel } from '../lib/categories'
import { formatTL } from '../lib/format'
import TransactionForm from '../components/TransactionForm'
import TransactionTable from '../components/TransactionTable'

const PAGE = 10

export default function Transactions() {
  const { state, dispatch } = useStore()
  const [f, setF] = useState({ search: '', type: 'all', category: 'all', from: '', to: '', sort: 'date-desc' })
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setPage(0) }

  const items = useMemo(() => filterTransactions(state.transactions, f), [state.transactions, f])
  const pages = Math.max(1, Math.ceil(items.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const slice = items.slice(cur * PAGE, cur * PAGE + PAGE)
  const net = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)

  return (
    <>
      {editing && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="İşlemi düzenle">
          <TransactionForm
            initial={editing}
            submitLabel="Kaydet"
            onCancel={() => setEditing(null)}
            onSubmit={(v) => { dispatch({ type: 'UPDATE', id: editing.id, payload: v }); setEditing(null) }}
          />
        </div>
      )}
      <section className="card">
        <h2>İşlemler</h2>
        <div className="filters">
          <input type="search" placeholder="Ara…" value={f.search} onChange={set('search')} aria-label="Ara" />
          <select value={f.type} onChange={set('type')} aria-label="Tür">
            <option value="all">Tümü</option><option value="expense">Gider</option><option value="income">Gelir</option>
          </select>
          <select value={f.category} onChange={set('category')} aria-label="Kategori">
            <option value="all">Tüm kategoriler</option>
            {Object.keys(ALL_CATEGORIES).map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
          <input type="date" value={f.from} onChange={set('from')} aria-label="Başlangıç tarihi" />
          <input type="date" value={f.to} onChange={set('to')} aria-label="Bitiş tarihi" />
          <select value={f.sort} onChange={set('sort')} aria-label="Sırala">
            <option value="date-desc">Yeni → eski</option><option value="date-asc">Eski → yeni</option>
            <option value="amount-desc">Tutar ↓</option><option value="amount-asc">Tutar ↑</option>
          </select>
        </div>
        <p className="muted">{items.length} işlem · net {formatTL(net)}</p>
        <TransactionTable items={slice} onEdit={setEditing} onDelete={(id) => dispatch({ type: 'DELETE', id })} />
        {pages > 1 && (
          <div className="pager">
            <button className="ghost" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹ Önceki</button>
            <span>{cur + 1} / {pages}</span>
            <button className="ghost" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Sonraki ›</button>
          </div>
        )}
      </section>
      <h2 className="section-title">Yeni işlem</h2>
      <TransactionForm onSubmit={(v) => dispatch({ type: 'ADD', payload: v })} />
    </>
  )
}
