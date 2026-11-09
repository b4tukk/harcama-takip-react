// Kategori → [rozet arka planı, yazı rengi, grafik rengi]
export const EXPENSE_CATEGORIES = {
  Market: ['#dcfce7', '#166534', '#22c55e'],
  Ulaşım: ['#dbeafe', '#1e40af', '#3b82f6'],
  Fatura: ['#fef9c3', '#854d0e', '#eab308'],
  Kira: ['#ede9fe', '#5b21b6', '#8b5cf6'],
  Eğlence: ['#fae8ff', '#86198f', '#d946ef'],
  Sağlık: ['#fee2e2', '#991b1b', '#ef4444'],
  Eğitim: ['#cffafe', '#155e75', '#06b6d4'],
  Diğer: ['#e5e7eb', '#374151', '#6b7280'],
}
export const INCOME_CATEGORIES = {
  Maaş: ['#d1fae5', '#065f46', '#10b981'],
  Ek_Gelir: ['#ccfbf1', '#115e59', '#14b8a6'],
  Diğer_Gelir: ['#e5e7eb', '#374151', '#6b7280'],
}
export const ALL_CATEGORIES = { ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES }
export const categoriesFor = (type) => (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
export const categoryLabel = (c) => c.replace('_', ' ')
export const colorOf = (c) => ALL_CATEGORIES[c] || ALL_CATEGORIES['Diğer']
