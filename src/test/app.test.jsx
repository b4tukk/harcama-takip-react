import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Recharts, jsdom'da ölçü alamadığı için ResizeObserver gerekir
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

const goto = async (user, name) => user.click(screen.getByRole('link', { name }))

describe('Uygulama akışı', () => {
  it('boş durumda başlar ve örnek veri yüklenebilir', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/Henüz kayıt yok/)).toBeInTheDocument()
    await goto(user, 'Veri')
    await user.click(screen.getByRole('button', { name: 'Örnek veriyi yükle' }))
    await goto(user, 'İşlemler')
    expect(screen.getByText(/\d+ işlem · net/)).toBeInTheDocument()
  })

  it('form doğrulaması hata gösterir, geçerli girdi işlem ekler', async () => {
    const user = userEvent.setup()
    render(<App />)
    await goto(user, 'İşlemler')
    const form = screen.getByRole('form', { name: 'Yeni işlem' })
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))
    expect(within(form).getByText('Açıklama boş olamaz.')).toBeInTheDocument()
    expect(within(form).getByText(/Tutar 0’dan büyük/)).toBeInTheDocument()
    await user.type(within(form).getByLabelText(/Açıklama/), 'Test market')
    await user.type(within(form).getByLabelText(/Tutar/), '1.250,50')
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))
    expect(screen.getByText('Test market')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /1\.250,50/ })).toBeInTheDocument()
  })

  it('silme sonrası geri al çalışır ve veri kalıcıdır', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await goto(user, 'İşlemler')
    const form = screen.getByRole('form', { name: 'Yeni işlem' })
    await user.type(within(form).getByLabelText(/Açıklama/), 'Silinecek')
    await user.type(within(form).getByLabelText(/Tutar/), '50')
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))
    await user.click(screen.getByRole('button', { name: 'Silinecek işlemini sil' }))
    expect(screen.queryByText('Silinecek', { selector: 'td' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Geri al' }))
    expect(screen.getByText('Silinecek', { selector: 'td' })).toBeInTheDocument()
    unmount()
    window.location.hash = '#/islemler'
    render(<App />)
    expect(screen.getByText('Silinecek', { selector: 'td' })).toBeInTheDocument()
  })

  it('bütçe ekleme ve doğrulama', async () => {
    const user = userEvent.setup()
    render(<App />)
    await goto(user, 'Bütçeler')
    await user.type(screen.getByLabelText(/Aylık limit/), 'abc')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Geçerli bir limit/)
    await user.clear(screen.getByLabelText(/Aylık limit/))
    await user.type(screen.getByLabelText(/Aylık limit/), '4500')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(screen.getByRole('progressbar', { name: 'Market bütçe kullanımı' })).toBeInTheDocument()
  })
})
