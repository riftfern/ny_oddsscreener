import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '@/components/auth/AuthProvider';
import Layout from '@/components/common/Layout';
import LandingPage from '@/components/marketing/LandingPage';
import LegalPage from '@/components/marketing/LegalPage';
import OddsPage from '@/components/odds/OddsPage';
import EVPage from '@/components/ev/EVPage';
import ArbitragePage from '@/components/arb/ArbitragePage';
import ExchangesPage from '@/components/exchanges/ExchangesPage';
import SettingsPage from '@/components/settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing landing page — no Layout, no Betslip */}
          <Route path="/" element={<LandingPage />} />

          {/* Legal page — public, no Layout */}
          <Route path="/legal" element={<LegalPage />} />

          {/* App shell */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<OddsPage />} />
            <Route path="ev" element={<EVPage />} />
            <Route path="arb" element={<ArbitragePage />} />
            <Route path="exchanges" element={<ExchangesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Redirects for old bookmarks */}
          <Route path="/ev" element={<Navigate to="/app/ev" replace />} />
          <Route path="/arb" element={<Navigate to="/app/arb" replace />} />
          <Route path="/exchanges" element={<Navigate to="/app/exchanges" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
