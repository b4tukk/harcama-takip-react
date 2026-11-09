import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { budgetStatus, expenseByCategory, insights, monthlySeries, monthTotals } from '../lib/selectors'
import { formatTL, monthKey, monthLabel, shiftMonth, todayISO } from '../lib/format'
import { CategoryChart, MonthlyChart } from '../components/Charts'
import { BudgetBar } from './Budgets'
import TransactionForm from '../components/TransactionForm'

export default function Dashboard() {
  const { state, dispatch } = useStore()
  const [month, setMonth] = useState(monthKey(todayISO()))
  const { transactions, budgets } = state

  const totals = useMemo(() => monthTotals(transactions, month), [transactions, month])
  const series = useMemo(() => monthlySeries(transactions, month, 6), [transactions, month])
  const cats = useMemo(() => expenseByCategory(transactions, month), [transactions, month])
  const bud = useMemo(() => budgetStatus(transactions, budgets, month).slice(0, 3), [transactions, budgets, month])
  const tips = useMemo(() => insights(transactions, budgets, month), [transactions, budgets, month])

  return (
    <>
      <div className="month-nav">
        <button className="ghost" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Önceki ay">‹</button>
        <strong>{monthLabel(month)}</strong>
        <button className="ghost" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Sonraki ay">›</button>
      </div>

      <section className="cards" aria-label="Aylık özet">
        <div className="card stat"><span>Gelir</span><strong className="income">{formatTL(totals.income)}</strong></div>
        <div className="card stat"><span>Gider</span><strong className="expense">{formatTL(totals.expense)}</strong></div>
        <div className="card stat"><span>Net</span><strong>{formatTL(totals.net)}</strong></div>
        <div className="card stat"><span>İşlem sayısı</span><strong>{totals.count}</strong></div>
      </section>

      {transactions.length === 0 && (
        <div className="card empty-state">
          <p>Henüz kayıt yok. Aşağıdan bir işlem ekleyin ya da örnek veriyi yükleyip uygulamayı keşfedin.</p>
          <Link className="btn" to="/veri">Örnek veri yükle</Link>
        </div>
      )}

      <section className="card" aria-label="Akıllı özet">
        <h2>Akıllı özet</h2>
        <ul className="tips">{tips.map((t, i) => <li key={i} className={t.tone}>{t.text}</li>)}</ul>
      </section>

      <div className="two">
        <section className="card"><h2>Son 6 ay</h2><MonthlyChart data={series} /></section>
        <section className="card"><h2>Gider dağılımı</h2><CategoryChart data={cats} /></section>
      </div>

      {bud.length > 0 && (
        <section className="card">
          <h2>Bütçe durumu</h2>
          {bud.map((b) => <BudgetBar key={b.category} b={b} />)}
          <Link to="/butceler">Tüm bütçeler →</Link>
        </section>
      )}

      <h2 className="section-title">Hızlı ekle</h2>
      <TransactionForm onSubmit={(v) => dispatch({ type: 'ADD', payload: v })} />
    </>
  )
}
