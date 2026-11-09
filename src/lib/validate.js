import { categoriesFor } from './categories'

export const parseAmount = (raw) => {
  if (typeof raw === 'number') return raw
  let s = String(raw).trim().replace(/[₺\s]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.') // 1.250,50 → 1250.50
  return Number(s)
}

/** Form girdisini doğrular. {ok, errors, value} döner. */
export function validateTransaction(input) {
  const errors = {}
  const title = String(input.title ?? '').trim()
  if (!title) errors.title = 'Açıklama boş olamaz.'
  else if (title.length > 60) errors.title = 'Açıklama en fazla 60 karakter olabilir.'

  const amount = parseAmount(input.amount ?? '')
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Tutar 0’dan büyük bir sayı olmalı.'
  else if (amount > 100_000_000) errors.amount = 'Tutar çok büyük.'

  const type = input.type === 'income' ? 'income' : 'expense'
  if (!(input.category in categoriesFor(type))) errors.category = 'Geçerli bir kategori seçin.'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date ?? '') || Number.isNaN(Date.parse(input.date))) errors.date = 'Geçerli bir tarih girin.'

  const ok = Object.keys(errors).length === 0
  return { ok, errors, value: ok ? { title, amount: Math.round(amount * 100) / 100, type, category: input.category, date: input.date } : null }
}
