import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import DataPage from './pages/DataPage'
import './App.css'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="islemler" element={<Transactions />} />
            <Route path="butceler" element={<Budgets />} />
            <Route path="veri" element={<DataPage />} />
            <Route path="*" element={<p className="empty">Sayfa bulunamadı.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
