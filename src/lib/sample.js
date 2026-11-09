import { shiftMonth, monthKey, todayISO } from './format'

// Deterministik (seedli) örnek veri: son 6 ay
function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

export function sampleTransactions(today = todayISO()) {
  const r = rng(42)
  const cur = monthKey(today)
  const out = []
  const add = (month, day, type, category, title, amount) =>
    out.push({ date: `${month}-${String(day).padStart(2, '0')}`, type, category, title, amount: Math.round(amount * 100) / 100 })
  for (let i = 5; i >= 0; i--) {
    const m = shiftMonth(cur, -i)
    add(m, 1, 'income', 'Maaş', 'Maaş', 32000)
    if (i % 2 === 0) add(m, 12, 'income', 'Ek_Gelir', 'Serbest iş', 2500 + r() * 2500)
    add(m, 2, 'expense', 'Kira', 'Kira', 12000)
    add(m, 5, 'expense', 'Fatura', 'Elektrik ve su', 700 + r() * 400)
    add(m, 7, 'expense', 'Fatura', 'İnternet', 450)
    for (let k = 0; k < 4; k++) add(m, 3 + k * 7, 'expense', 'Market', 'Market alışverişi', 700 + r() * 800 + (i === 0 ? 250 : 0))
    for (let k = 0; k < 3; k++) add(m, 4 + k * 9, 'expense', 'Ulaşım', 'Ulaşım', 150 + r() * 250)
    add(m, 14, 'expense', 'Eğlence', 'Sinema / dışarıda yemek', 600 + r() * 900)
    if (r() < 0.5) add(m, 20, 'expense', 'Sağlık', 'Eczane', 150 + r() * 350)
  }
  return out.filter((t) => t.date <= today)
}

export const sampleBudgets = { Market: 4500, Ulaşım: 1000, Eğlence: 1200, Fatura: 1500 }
