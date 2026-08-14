import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './ui/tokens/globals.css'
import './i18n.js'

import Login from './ui/pages/login.js'
import AdminDashboard from './ui/pages/admin_dashboard.js'
import ShipmentList from './ui/pages/shipment_list.js'
import ShipmentDetail from './ui/pages/shipment_detail.js'
import AccountingDashboard from './ui/pages/accounting/index.js'
import PrivateRoute from './ui/components/private_route.js'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/shipments" element={
            <PrivateRoute role="logistic">
              <ShipmentList />
            </PrivateRoute>
          } />
          <Route path="/shipments/:id" element={
            <PrivateRoute role="logistic">
              <ShipmentDetail />
            </PrivateRoute>
          } />
          
          <Route path="/accounting" element={
            <PrivateRoute role="logistic">
              <AccountingDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  )
}
