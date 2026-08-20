import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '@/components/auth/AuthProvider';
import Layout from '@/components/common/Layout';
import LandingPage from '@/components/marketing/LandingPage';
import LegalPage from '@/components/marketing/LegalPage';
import TermsPage from '@/components/marketing/TermsPage';
import PrivacyPage from '@/components/marketing/PrivacyPage';
import OddsPage from '@/components/odds/OddsPage';
import EVPage from '@/components/ev/EVPage';
import ExchangesPage from '@/components/exchanges/ExchangesPage';
import SettingsPage from '@/components/settings/SettingsPage';
import TicketsPage from '@/components/tickets/TicketsPage';
import NotFound, { AppNotFound } from '@/components/common/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing landing page — no Layout, no Betslip */}
          <Route path="/" element={<LandingPage />} />

          {/* Public legal — Stripe can link /terms and /privacy */}
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<Navigate to="/terms" replace />} />
          <Route path="/legal/privacy" element={<Navigate to="/privacy" replace />} />

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
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="arb" element={<Navigate to="/app/tickets" replace />} />
            <Route path="exchanges" element={<ExchangesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<AppNotFound />} />
          </Route>

          {/* Redirects for old bookmarks */}
          <Route path="/ev" element={<Navigate to="/app/ev" replace />} />
          <Route path="/arb" element={<Navigate to="/app/tickets" replace />} />
          <Route path="/exchanges" element={<Navigate to="/app/exchanges" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
