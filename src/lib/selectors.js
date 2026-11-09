import { monthKey, shiftMonth, shortMonth, monthLabel } from './format'

const sum = (arr) => arr.reduce((s, t) => s + t.amount, 0)
const round2 = (n) => Math.round(n * 100) / 100

export function filterTransactions(txs, { search = '', type = 'all', category = 'all', from = '', to = '', sort = 'date-desc' } = {}) {
  const q = search.trim().toLocaleLowerCase('tr-TR')
  const out = txs.filter(
    (t) =>
      (type === 'all' || t.type === type) &&
      (category === 'all' || t.category === category) &&
      (!from || t.date >= from) &&
      (!to || t.date <= to) &&
      (!q || t.title.toLocaleLowerCase('tr-TR').includes(q)),
  )
  const cmp = {
    'date-desc': (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    'date-asc': (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
    'amount-desc': (a, b) => b.amount - a.amount,
    'amount-asc': (a, b) => a.amount - b.amount,
  }[sort]
  return out.sort(cmp)
}

export function monthTotals(txs, key) {
  const m = txs.filter((t) => monthKey(t.date) === key)
  const income = round2(sum(m.filter((t) => t.type === 'income')))
  const expense = round2(sum(m.filter((t) => t.type === 'expense')))
  return { income, expense, net: round2(income - expense), count: m.length }
}

/** Son `n` ay için gelir/gider serisi (eskiden yeniye). */
export function monthlySeries(txs, endKey, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const key = shiftMonth(endKey, i - (n - 1))
    const { income, expense } = monthTotals(txs, key)
    return { key, ay: shortMonth(key), Gelir: income, Gider: expense }
  })
}

export function expenseByCategory(txs, key) {
  const map = {}
  txs.filter((t) => t.type === 'expense' && monthKey(t.date) === key).forEach((t) => (map[t.category] = (map[t.category] || 0) + t.amount))
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value)
}

/** Her bütçe için harcanan, kalan, oran ve durum. */
export function budgetStatus(txs, budgets, key) {
  const spent = Object.fromEntries(expenseByCategory(txs, key).map((c) => [c.name, c.value]))
  return Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const s = spent[category] || 0
      const ratio = s / limit
      return { category, limit, spent: round2(s), remaining: round2(limit - s), ratio, level: ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok' }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

/** Kural tabanlı "akıllı özet" cümleleri. */
export function insights(txs, budgets, key) {
  const out = []
  const cur = monthTotals(txs, key)
  const prev = monthTotals(txs, shiftMonth(key, -1))
  if (cur.count === 0) return [{ tone: 'info', text: `${monthLabel(key)} için kayıt yok.` }]

  if (cur.expense > 0 && prev.expense > 0) {
    const d = ((cur.expense - prev.expense) / prev.expense) * 100
    if (Math.abs(d) >= 5) out.push({ tone: d > 0 ? 'bad' : 'good', text: `Toplam gider geçen aya göre %${Math.abs(Math.round(d))} ${d > 0 ? 'arttı' : 'azaldı'}.` })
  }
  const cats = expenseByCategory(txs, key)
  const prevCats = Object.fromEntries(expenseByCategory(txs, shiftMonth(key, -1)).map((c) => [c.name, c.value]))
  const jumps = cats
    .filter((c) => prevCats[c.name] > 0 && c.value > prevCats[c.name] * 1.3 && c.value - prevCats[c.name] > 100)
    .sort((a, b) => b.value / prevCats[b.name] - a.value / prevCats[a.name])
  if (jumps[0]) out.push({ tone: 'bad', text: `${jumps[0].name} harcaması geçen aya göre %${Math.round((jumps[0].value / prevCats[jumps[0].name] - 1) * 100)} yükseldi.` })
  if (cats[0] && cur.expense > 0) out.push({ tone: 'info', text: `En büyük gider kalemi ${cats[0].name}: giderlerin %${Math.round((cats[0].value / cur.expense) * 100)}’i.` })
  budgetStatus(txs, budgets, key)
    .filter((b) => b.level !== 'ok')
    .slice(0, 2)
    .forEach((b) => out.push({ tone: b.level === 'over' ? 'bad' : 'warn', text: b.level === 'over' ? `${b.category} bütçesi aşıldı (${Math.round(b.ratio * 100)}%).` : `${b.category} bütçesinin %${Math.round(b.ratio * 100)}’ine ulaşıldı.` }))
  if (cur.income > 0) {
    const rate = Math.round((cur.net / cur.income) * 100)
    out.push({ tone: rate >= 20 ? 'good' : rate < 0 ? 'bad' : 'info', text: `Tasarruf oranı %${rate}.` })
  }
  return out
}
