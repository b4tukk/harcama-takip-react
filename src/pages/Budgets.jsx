import { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { budgetStatus } from '../lib/selectors'
import { EXPENSE_CATEGORIES, colorOf } from '../lib/categories'
import { formatTL, monthKey, monthLabel, todayISO } from '../lib/format'
import { parseAmount } from '../lib/validate'

export function BudgetBar({ b }) {
  const pct = Math.min(100, Math.round(b.ratio * 100))
  return (
    <div className="budget">
      <div className="budget-head">
        <strong>{b.category}</strong>
        <span className={b.level}>{formatTL(b.spent)} / {formatTL(b.limit)} ({Math.round(b.ratio * 100)}%)</span>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.category} bütçe kullanımı`}>
        <div className={`fill ${b.level}`} style={{ width: `${pct}%`, background: b.level === 'ok' ? colorOf(b.category)[2] : undefined }} />
      </div>
      <small className="muted">{b.remaining >= 0 ? `${formatTL(b.remaining)} kaldı` : `${formatTL(-b.remaining)} aşıldı`}</small>
    </div>
  )
}

export default function Budgets() {
  const { state, dispatch } = useStore()
  const month = monthKey(todayISO())
  const status = useMemo(() => budgetStatus(state.transactions, state.budgets, month), [state, month])
  const [cat, setCat] = useState('Market')
  const [limit, setLimit] = useState('')
  const [err, setErr] = useState('')

  const save = (e) => {
    e.preventDefault()
    const v = parseAmount(limit)
    if (!Number.isFinite(v) || v < 0) return setErr('Geçerli bir limit girin (silmek için 0).')
    setErr('')
    dispatch({ type: 'SET_BUDGET', category: cat, limit: v })
    setLimit('')
  }

  return (
    <>
      <section className="card">
        <h2>{monthLabel(month)} bütçeleri</h2>
        {status.length === 0 ? <p className="empty">Henüz bütçe tanımlanmadı.</p> : status.map((b) => <BudgetBar key={b.category} b={b} />)}
      </section>
      <form className="card form" onSubmit={save}>
        <h2>Bütçe belirle</h2>
        <div className="grid-form">
          <label>Kategori
            <select value={cat} onChange={(e) => setCat(e.target.value)}>{Object.keys(EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label>Aylık limit (₺)<input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="decimal" placeholder="4500" />
            {err && <span className="field-error" role="alert">{err}</span>}
          </label>
        </div>
        <div className="actions"><button type="submit">Kaydet</button></div>
      </form>
    </>
  )
}
