import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './ui/tokens/globals.css'
import './i18n.js'

import Login from './ui/pages/login.js'
import AdminDashboard from './ui/pages/admin_dashboard.js'
import ShipmentList from './ui/pages/shipment_list.js'
import ShipmentFinancial from './ui/pages/shipment_financial.js'
import ShipmentDetail from './ui/pages/shipment_detail.js'
import AccountingDashboard from './ui/pages/accounting/index.js'
import CustomerList from './ui/pages/master_data/customer_list.js'
import ShippingLineList from './ui/pages/master_data/shipping_line_list.js'
import PortList from './ui/pages/master_data/port_list.js'
import VendorList from './ui/pages/master_data/vendor_list.js'
import ChargeList from './ui/pages/master_data/charge_list.js'
import Settings from './ui/pages/settings.js'
import ShipmentConfig from './ui/pages/settings/shipment_config.js'
import PrivateRoute from './ui/components/private_route.js'
import { ThemeProvider } from './ui/context/theme_context.js'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
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
          <Route path="/shipments/financial" element={
            <PrivateRoute role="logistic">
              <ShipmentFinancial />
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

          <Route path="/master-data/customers" element={
            <PrivateRoute role="logistic">
              <CustomerList />
            </PrivateRoute>
          } />

          <Route path="/master-data/vendors" element={
            <PrivateRoute role="logistic">
              <VendorList />
            </PrivateRoute>
          } />

          <Route path="/master-data/charges" element={
            <PrivateRoute role="logistic">
              <ChargeList />
            </PrivateRoute>
          } />

          <Route path="/master-data/shipping-lines" element={
            <PrivateRoute role="logistic">
              <ShippingLineList />
            </PrivateRoute>
          } />

          <Route path="/master-data/ports" element={
            <PrivateRoute role="logistic">
              <PortList />
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute role="logistic">
              <Settings />
            </PrivateRoute>
          } />

          <Route path="/settings/shipments" element={
            <PrivateRoute role="logistic">
              <ShipmentConfig />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
  )
}
