import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Home from './pages/Home';
import Services from './pages/Services';
import Shop from './pages/Shop';
import Books from './pages/Books';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PTDashboard from './pages/PTDashboard';
import MyLibrary from './pages/MyLibrary';
import Footer from './components/Footer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import CookieBanner from './components/CookieBanner';
import ScrollToTop from './components/ScrollToTop';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import TermsOfService from './pages/TermsOfService';
import MonthlyMenu from './pages/MonthlyMenu';
import Gamification from './pages/Gamification';
import Integrazione from './pages/Integrazione';
import RestartLanding from './pages/RestartLanding';
import RestartResult from './pages/RestartResult';
import RestartPurchase from './pages/RestartPurchase';
import ConsultationLanding from './pages/ConsultationLanding';
import ThankYouConsultation from './pages/ThankYouConsultation';

// Component to track page views on route changes (SPA navigation)
function PageViewTracker() {
  const location = useLocation();
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    // Skip tracking on initial mount to avoid duplicate PageView
    // (already tracked by pixel base in index.html)
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    // Track PageView only on subsequent route changes
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
}

function App() {
  const { loading, error, user } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">VN</span>
          </div>
          <p className="text-gray-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-brand-burgundy text-white px-6 py-3 rounded-lg hover:bg-brand-burgundy/90 transition-colors duration-200"
            >
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <PageViewTracker />
      <ScrollToTop />
      <Routes>
        {/* Landing Pages - NO header/footer */}
        <Route path="/restart" element={<RestartLanding />} />
        <Route path="/restart-result" element={<RestartResult />} />
        <Route path="/acquista-metodo-restart" element={<RestartPurchase />} />
        <Route path="/consulenza-alimentare" element={<ConsultationLanding />} />
        <Route path="/consulenza-grazie" element={<ThankYouConsultation />} />

        {/* Regular Pages - WITH header/footer */}
        <Route path="*" element={
          <div className="min-h-screen bg-brand-cream">
            <Header />
            <OfflineIndicator />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/servizi" element={<Services />} />
                <Route path="/menu-mensili" element={<MonthlyMenu />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/libri" element={<Books />} />
                <Route path="/chi-sono" element={<About />} />
                <Route path="/contatti" element={<Contact />} />
                <Route path="/integrazione" element={<Integrazione />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-library" element={<MyLibrary />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/pt-dashboard" element={<PTDashboard />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/termini-condizioni" element={<TermsOfService />} />
              </Routes>
            </main>
            <Footer />
            <PWAInstallPrompt />
            <CookieBanner />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;