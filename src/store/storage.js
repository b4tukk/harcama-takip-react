import { initialState } from './reducer'

export const STORAGE_KEY = 'harcama-takip:v2'
const LEGACY_KEY = 'harcamalar' // v1: sadece harcama dizisi

/** v1 kayıtlarını (gider dizisi) v2 şemasına çevirir. */
export function migrateLegacy(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((x) => x && typeof x.amount === 'number' && x.title && x.date)
    .map((x, i) => ({ id: x.id || `legacy-${i}`, createdAt: i, type: 'expense', category: x.category || 'Diğer', title: x.title, amount: x.amount, date: x.date }))
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return {
        ...initialState,
        transactions: Array.isArray(p.transactions) ? p.transactions : [],
        budgets: p.budgets && typeof p.budgets === 'object' ? p.budgets : {},
        theme: ['light', 'dark', 'system'].includes(p.theme) ? p.theme : 'system',
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return { ...initialState, transactions: migrateLegacy(JSON.parse(legacy)) }
  } catch {
    /* bozuk veri veya erişim engeli: boş durumla başla */
  }
  return initialState
}

export function saveState(state) {
  try {
    const { transactions, budgets, theme } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, transactions, budgets, theme }))
  } catch {
    /* depolama dolu/kapalı */
  }
}
