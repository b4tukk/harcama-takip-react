import { useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { fromCSV, toCSV } from '../lib/csv'
import { sampleBudgets, sampleTransactions } from '../lib/sample'

const download = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export default function DataPage() {
  const { state, dispatch } = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    e.target.value = ''
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const p = JSON.parse(text)
        const list = Array.isArray(p) ? p : p.transactions
        const r = fromCSV(toCSV(list.map((t) => ({ ...t, amount: Number(t.amount) }))))
        dispatch({ type: 'IMPORT', transactions: r.valid })
        setMsg({ ok: true, text: `${r.valid.length} işlem içe aktarıldı${r.errors.length ? `, ${r.errors.length} satır atlandı` : ''}.` })
      } else {
        const r = fromCSV(text)
        if (r.valid.length) dispatch({ type: 'IMPORT', transactions: r.valid })
        setMsg({ ok: r.valid.length > 0, text: `${r.valid.length} işlem içe aktarıldı.`, errors: r.errors.slice(0, 5) })
      }
    } catch {
      setMsg({ ok: false, text: 'Dosya okunamadı. Geçerli bir CSV ya da JSON seçin.' })
    }
  }

  return (
    <>
      <section className="card">
        <h2>Dışa aktar</h2>
        <p className="muted">{state.transactions.length} işlem kayıtlı.</p>
        <div className="actions left">
          <button onClick={() => download('harcamalar.csv', toCSV(state.transactions), 'text/csv')}>CSV indir</button>
          <button className="ghost" onClick={() => download('yedek.json', JSON.stringify({ transactions: state.transactions, budgets: state.budgets }, null, 2), 'application/json')}>JSON yedek</button>
        </div>
      </section>
      <section className="card">
        <h2>İçe aktar</h2>
        <p className="muted">CSV başlıkları: <code>tarih,tur,kategori,aciklama,tutar</code> (tur: gelir/gider). Geçersiz satırlar atlanır.</p>
        <input ref={fileRef} type="file" accept=".csv,.json" onChange={onFile} aria-label="Dosya seç" />
        {msg && (
          <div role="status" className={msg.ok ? 'ok-msg' : 'field-error'}>
            {msg.text}
            {msg.errors?.map((e) => <div key={e.line}>Satır {e.line}: {Object.values(e.errors).join(' ')}</div>)}
          </div>
        )}
      </section>
      <section className="card">
        <h2>Örnek veri ve sıfırlama</h2>
        <div className="actions left">
          <button onClick={() => dispatch({ type: 'LOAD_SAMPLE', transactions: sampleTransactions(), budgets: sampleBudgets })}>Örnek veriyi yükle</button>
          <button className="ghost danger" onClick={() => window.confirm('Tüm veriler silinecek. Emin misiniz?') && dispatch({ type: 'RESET' })}>Tüm verileri sil</button>
        </div>
      </section>
    </>
  )
}
