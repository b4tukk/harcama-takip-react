import { useState } from 'react'
import { categoriesFor, categoryLabel } from '../lib/categories'
import { todayISO } from '../lib/format'
import { validateTransaction } from '../lib/validate'

const empty = () => ({ type: 'expense', title: '', amount: '', category: 'Market', date: todayISO() })

export default function TransactionForm({ initial, onSubmit, onCancel, submitLabel = 'Ekle' }) {
  const [form, setForm] = useState(() => (initial ? { ...initial, amount: String(initial.amount).replace('.', ',') } : empty()))
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const setType = (type) => setForm((f) => ({ ...f, type, category: type === 'income' ? 'Maaş' : 'Market' }))

  const submit = (e) => {
    e.preventDefault()
    const res = validateTransaction(form)
    setErrors(res.errors)
    if (!res.ok) return
    onSubmit(res.value)
    if (!initial) setForm({ ...empty(), type: form.type, category: form.category, date: form.date })
  }

  const err = (k) => errors[k] && <span className="field-error" role="alert">{errors[k]}</span>

  return (
    <form className="card form" onSubmit={submit} noValidate aria-label={initial ? 'İşlemi düzenle' : 'Yeni işlem'}>
      <div className="seg" role="group" aria-label="İşlem türü">
        <button type="button" className={form.type === 'expense' ? 'on' : ''} aria-pressed={form.type === 'expense'} onClick={() => setType('expense')}>Gider</button>
        <button type="button" className={form.type === 'income' ? 'on' : ''} aria-pressed={form.type === 'income'} onClick={() => setType('income')}>Gelir</button>
      </div>
      <div className="grid-form">
        <label>Açıklama<input value={form.title} onChange={set('title')} placeholder="ör. Haftalık market" aria-invalid={!!errors.title} />{err('title')}</label>
        <label>Tutar (₺)<input value={form.amount} onChange={set('amount')} inputMode="decimal" placeholder="1250,50" aria-invalid={!!errors.amount} />{err('amount')}</label>
        <label>Kategori
          <select value={form.category} onChange={set('category')}>
            {Object.keys(categoriesFor(form.type)).map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
          {err('category')}
        </label>
        <label>Tarih<input type="date" value={form.date} onChange={set('date')} aria-invalid={!!errors.date} />{err('date')}</label>
      </div>
      <div className="actions">
        {onCancel && <button type="button" className="ghost" onClick={onCancel}>Vazgeç</button>}
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}
