import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'
import OwnerDashboard from './pages/owner/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
