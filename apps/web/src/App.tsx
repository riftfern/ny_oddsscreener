import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/common/Layout';
import LandingPage from '@/components/marketing/LandingPage';
import OddsPage from '@/components/odds/OddsPage';
import EVPage from '@/components/ev/EVPage';
import ArbitragePage from '@/components/arb/ArbitragePage';
import ExchangesPage from '@/components/exchanges/ExchangesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing landing page — no Layout, no Betslip */}
        <Route path="/" element={<LandingPage />} />

        {/* App shell */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<OddsPage />} />
          <Route path="ev" element={<EVPage />} />
          <Route path="arb" element={<ArbitragePage />} />
          <Route path="exchanges" element={<ExchangesPage />} />
        </Route>

        {/* Redirects for old bookmarks */}
        <Route path="/ev" element={<Navigate to="/app/ev" replace />} />
        <Route path="/arb" element={<Navigate to="/app/arb" replace />} />
        <Route path="/exchanges" element={<Navigate to="/app/exchanges" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
