import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/common/Layout';
import OddsPage from '@/components/odds/OddsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OddsPage />} />
          <Route path="ev" element={<div className="p-4">+EV Finder - Coming Soon</div>} />
          <Route path="arb" element={<div className="p-4">Arbitrage Finder - Coming Soon</div>} />
          <Route path="exchanges" element={<div className="p-4">Exchanges - Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
