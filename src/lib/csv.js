import { validateTransaction } from './validate'

const HEADER = ['tarih', 'tur', 'kategori', 'aciklama', 'tutar']
const esc = (v) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))

export function toCSV(txs) {
  const rows = txs.map((t) => [t.date, t.type === 'income' ? 'gelir' : 'gider', t.category, t.title, t.amount.toFixed(2)])
  return [HEADER, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

/** RFC-4180 benzeri basit ayrıştırıcı (tırnak, çift tırnak, satır sonu). */
export function parseCSVRows(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** CSV metnini doğrulanmış işlemlere çevirir. {valid, errors:[{line,errors}]} */
export function fromCSV(text) {
  const rows = parseCSVRows(text)
  if (!rows.length) return { valid: [], errors: [{ line: 0, errors: { file: 'Dosya boş.' } }] }
  const head = rows[0].map((h) => h.trim().toLowerCase())
  const idx = Object.fromEntries(HEADER.map((h) => [h, head.indexOf(h)]))
  if (Object.values(idx).some((i) => i < 0)) return { valid: [], errors: [{ line: 1, errors: { file: `Başlık satırı şunları içermeli: ${HEADER.join(', ')}` } }] }
  const valid = [], errors = []
  rows.slice(1).forEach((r, i) => {
    const res = validateTransaction({ date: r[idx.tarih]?.trim(), type: r[idx.tur]?.trim().toLowerCase() === 'gelir' ? 'income' : 'expense', category: r[idx.kategori]?.trim(), title: r[idx.aciklama], amount: r[idx.tutar] })
    if (res.ok) valid.push(res.value)
    else errors.push({ line: i + 2, errors: res.errors })
  })
  return { valid, errors }
}
