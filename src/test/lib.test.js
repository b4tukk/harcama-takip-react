import { describe, expect, it } from 'vitest'
import { parseAmount, validateTransaction } from '../lib/validate'
import { fromCSV, parseCSVRows, toCSV } from '../lib/csv'
import { budgetStatus, expenseByCategory, filterTransactions, insights, monthTotals, monthlySeries } from '../lib/selectors'
import { shiftMonth } from '../lib/format'
import { initialState, reducer } from '../store/reducer'
import { STORAGE_KEY, loadState, migrateLegacy, saveState } from '../store/storage'
import { sampleTransactions } from '../lib/sample'

const T = (o) => ({ id: Math.random().toString(), createdAt: 0, type: 'expense', category: 'Market', title: 'x', amount: 100, date: '2026-03-10', ...o })

describe('validate', () => {
  it('Türkçe ve düz sayı biçimlerini çözer', () => {
    expect(parseAmount('1.250,50')).toBe(1250.5)
    expect(parseAmount('1250,5')).toBe(1250.5)
    expect(parseAmount('₺ 99')).toBe(99)
    expect(parseAmount(12)).toBe(12)
  })
  it('geçerli girdiyi normalleştirir', () => {
    const r = validateTransaction({ title: '  Market ', amount: '12,345', category: 'Market', date: '2026-03-10', type: 'expense' })
    expect(r.ok).toBe(true)
    expect(r.value).toMatchObject({ title: 'Market', amount: 12.35 })
  })
  it.each([
    [{ title: '', amount: '5', category: 'Market', date: '2026-03-10' }, 'title'],
    [{ title: 'a', amount: '0', category: 'Market', date: '2026-03-10' }, 'amount'],
    [{ title: 'a', amount: '-3', category: 'Market', date: '2026-03-10' }, 'amount'],
    [{ title: 'a', amount: 'abc', category: 'Market', date: '2026-03-10' }, 'amount'],
    [{ title: 'a', amount: '5', category: 'Maaş', date: '2026-03-10', type: 'expense' }, 'category'],
    [{ title: 'a', amount: '5', category: 'Market', date: '10.03.2026' }, 'date'],
    [{ title: 'a'.repeat(61), amount: '5', category: 'Market', date: '2026-03-10' }, 'title'],
  ])('geçersiz girdiyi reddeder %#', (input, field) => {
    const r = validateTransaction(input)
    expect(r.ok).toBe(false)
    expect(r.errors[field]).toBeTruthy()
  })
})

describe('csv', () => {
  it('tırnaklı ve virgüllü alanlarla gidiş-dönüş yapar', () => {
    const txs = [T({ title: 'Kahve, "büyük"', amount: 45.5 }), T({ type: 'income', category: 'Maaş', title: 'Maaş', amount: 30000, date: '2026-03-01' })]
    const { valid, errors } = fromCSV(toCSV(txs))
    expect(errors).toHaveLength(0)
    expect(valid.map((v) => [v.title, v.amount, v.type])).toEqual([['Kahve, "büyük"', 45.5, 'expense'], ['Maaş', 30000, 'income']])
  })
  it('geçersiz satırları hata listesine koyar, geçerlileri alır', () => {
    const csv = 'tarih,tur,kategori,aciklama,tutar\n2026-03-01,gider,Market,Süt,30\n2026-03-02,gider,Market,,30\n2026-13-45,gider,Market,Ekmek,5'
    const r = fromCSV(csv)
    expect(r.valid).toHaveLength(1)
    expect(r.errors.map((e) => e.line)).toEqual([3, 4])
  })
  it('başlık eksikse dosya hatası verir', () => {
    expect(fromCSV('a,b\n1,2').errors[0].errors.file).toMatch(/Başlık/)
    expect(fromCSV('').errors[0].errors.file).toBeTruthy()
  })
  it('CRLF satır sonlarını işler', () => {
    expect(parseCSVRows('a,b\r\nc,d\r\n')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('selectors', () => {
  const txs = [
    T({ date: '2026-03-02', amount: 500, category: 'Market', title: 'Şeker' }),
    T({ date: '2026-03-15', amount: 300, category: 'Ulaşım' }),
    T({ date: '2026-02-10', amount: 200, category: 'Market' }),
    T({ date: '2026-03-01', type: 'income', category: 'Maaş', amount: 10000 }),
  ]
  it('aylık toplamlar', () => expect(monthTotals(txs, '2026-03')).toEqual({ income: 10000, expense: 800, net: 9200, count: 3 }))
  it('seri son 6 ayı eskiden yeniye verir', () => {
    const s = monthlySeries(txs, '2026-03', 6)
    expect(s).toHaveLength(6)
    expect(s[0].key).toBe('2025-10')
    expect(s[5]).toMatchObject({ key: '2026-03', Gider: 800, Gelir: 10000 })
  })
  it('kategori dağılımı azalan sıralı', () => expect(expenseByCategory(txs, '2026-03').map((c) => c.name)).toEqual(['Market', 'Ulaşım']))
  it('filtre Türkçe büyük/küçük harfe duyarsız', () => {
    expect(filterTransactions(txs, { search: 'ŞEKER' })).toHaveLength(1)
    expect(filterTransactions(txs, { type: 'income' })).toHaveLength(1)
    expect(filterTransactions(txs, { from: '2026-03-01', to: '2026-03-02' })).toHaveLength(2)
    expect(filterTransactions(txs, { sort: 'amount-desc' })[0].amount).toBe(10000)
  })
  it('bütçe durumu seviyeleri', () => {
    const b = budgetStatus(txs, { Market: 600, Ulaşım: 310, Eğlence: 100 }, '2026-03')
    expect(b.find((x) => x.category === 'Market').level).toBe('warn')
    expect(b.find((x) => x.category === 'Ulaşım').level).toBe('warn')
    expect(budgetStatus(txs, { Market: 400 }, '2026-03')[0]).toMatchObject({ level: 'over', remaining: 100 - 200 })
  })
  it('akıllı özet artışı ve bütçe aşımını yakalar', () => {
    const t = [T({ date: '2026-02-10', amount: 1000 }), T({ date: '2026-03-10', amount: 2000 }), T({ type: 'income', category: 'Maaş', date: '2026-03-01', amount: 5000 })]
    const tips = insights(t, { Market: 1500 }, '2026-03').map((x) => x.text).join(' | ')
    expect(tips).toMatch(/%100 arttı/)
    expect(tips).toMatch(/Market bütçesi aşıldı/)
    expect(tips).toMatch(/Tasarruf oranı %60/)
  })
  it('boş ay için bilgi mesajı', () => expect(insights([], {}, '2026-03')[0].tone).toBe('info'))
  it('ay kaydırma yıl sınırını geçer', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
  it('örnek veri tutarlı ve gelecekte kayıt yok', () => {
    const s = sampleTransactions('2026-03-15')
    expect(s.length).toBeGreaterThan(50)
    expect(s.every((x) => x.date <= '2026-03-15' && x.amount > 0)).toBe(true)
  })
})

describe('reducer', () => {
  it('ekle, güncelle, sil ve geri al', () => {
    let s = reducer(initialState, { type: 'ADD', payload: { type: 'expense', category: 'Market', title: 'a', amount: 5, date: '2026-03-01' } })
    const id = s.transactions[0].id
    s = reducer(s, { type: 'UPDATE', id, payload: { amount: 9 } })
    expect(s.transactions[0].amount).toBe(9)
    s = reducer(s, { type: 'DELETE', id })
    expect(s.transactions).toHaveLength(0)
    expect(s.lastDeleted.id).toBe(id)
    s = reducer(s, { type: 'UNDO_DELETE' })
    expect(s.transactions).toHaveLength(1)
    expect(s.lastDeleted).toBeNull()
  })
  it('olmayan kaydı silmek durumu değiştirmez', () => {
    expect(reducer(initialState, { type: 'DELETE', id: 'yok' })).toBe(initialState)
  })
  it('bütçe 0 ise bütçeyi kaldırır', () => {
    let s = reducer(initialState, { type: 'SET_BUDGET', category: 'Market', limit: 500 })
    expect(s.budgets.Market).toBe(500)
    s = reducer(s, { type: 'SET_BUDGET', category: 'Market', limit: 0 })
    expect(s.budgets).toEqual({})
  })
  it('içe aktarma ekler veya değiştirir; sıfırlama temayı korur', () => {
    const imp = [{ type: 'expense', category: 'Market', title: 'i', amount: 1, date: '2026-03-01' }]
    let s = reducer({ ...initialState, theme: 'dark', transactions: [T()] }, { type: 'IMPORT', transactions: imp })
    expect(s.transactions).toHaveLength(2)
    s = reducer(s, { type: 'IMPORT', transactions: imp, replace: true })
    expect(s.transactions).toHaveLength(1)
    expect(reducer(s, { type: 'RESET' })).toMatchObject({ transactions: [], theme: 'dark' })
  })
})

describe('storage', () => {
  it('kaydet/yükle gidiş-dönüş', () => {
    saveState({ ...initialState, transactions: [T({ id: 'k1' })], budgets: { Market: 100 }, theme: 'dark' })
    const s = loadState()
    expect(s.transactions[0].id).toBe('k1')
    expect(s.budgets).toEqual({ Market: 100 })
    expect(s.theme).toBe('dark')
  })
  it('v1 verisini (eski anahtar) v2 şemasına taşır', () => {
    localStorage.setItem('harcamalar', JSON.stringify([{ id: 'a', title: 'Eski', amount: 10, category: 'Market', date: '2026-01-01' }, { bozuk: true }]))
    const s = loadState()
    expect(s.transactions).toHaveLength(1)
    expect(s.transactions[0]).toMatchObject({ type: 'expense', title: 'Eski' })
    expect(migrateLegacy('x')).toEqual([])
  })
  it('bozuk JSON olursa boş durumla başlar', () => {
    localStorage.setItem(STORAGE_KEY, '{bozuk')
    expect(loadState().transactions).toEqual([])
  })
})
