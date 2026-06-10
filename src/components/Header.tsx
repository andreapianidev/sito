import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BookingModal from './BookingModal';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading, error } = useAuth();

  // Hide header in dashboard and admin pages
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname === '/pt-dashboard';
  const isAdminPage = location.pathname === '/admin';

  if (isDashboardPage || isAdminPage) {
    return null;
  }

  const navigation = [
    { name: 'Home', href: '/', external: false },
    { name: 'Servizi', href: '/servizi', external: false },
    { name: 'Shop Online', href: '/shop', external: false },
    { name: 'Libri & Guide', href: '/libri', external: false },
    { name: 'Chi Sono', href: '/chi-sono', external: false },
    { name: 'Contatti', href: '/contatti', external: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Show user info only if user exists and profile is loaded (or loading)
  const showUserInfo = user && (profile || loading);
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Utente';
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-50 border-b border-white/20">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-2xl flex items-center justify-center shadow-medium hover:shadow-large hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-xl">VN</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold gradient-text">Dr.ssa Vilma Nardini</h1>
              <p className="text-sm text-gray-600 font-medium">Nutrizionista Specializzata</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-300 text-gray-700 hover:text-brand-burgundy hover:bg-brand-burgundy/5"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-brand-burgundy bg-brand-burgundy/10 shadow-soft'
                      : 'text-gray-700 hover:text-brand-burgundy hover:bg-brand-burgundy/5'
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="btn-primary text-sm px-6 py-3"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="relative z-10">Prenota</span>
            </button>
            {showUserInfo ? (
              <div className="flex items-center space-x-3">
                {profile?.subscription_type === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-purple-600 hover:bg-purple-100 transition-all duration-300 font-medium"
                  >
                    <span>👨‍💼</span>
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-24 truncate">{userName}</span>
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/', { replace: true });
                  }}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 font-medium text-sm"
                >
                  Esci
                </button>
              </div>
            ) : !loading ? (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 font-medium"
              >
                Accedi
              </Link>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 z-50 relative"
              type="button"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-[60] animate-slide-down">
            <div className="px-4 py-6">
              <div className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-gray-700 hover:text-brand-burgundy hover:bg-brand-burgundy/5"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                        isActive(item.href)
                          ? 'text-brand-burgundy bg-brand-burgundy/10'
                          : 'text-gray-700 hover:text-brand-burgundy hover:bg-brand-burgundy/5'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                <div className="pt-4 border-t border-gray-200/50 flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsBookingOpen(true);
                    }}
                    className="btn-primary text-center relative z-10"
                  >
                    <span className="relative z-10">Prenota Consulenza</span>
                  </button>
                  {showUserInfo ? (
                    <div className="space-y-3">
                      {profile?.subscription_type === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="px-4 py-3 rounded-xl text-purple-600 hover:bg-purple-100 transition-all duration-300 text-center font-medium block relative z-10"
                        >
                          👨‍💼 Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 text-center font-medium block relative z-10"
                      >
                        👤 Area Personale ({userName})
                      </Link>
                      <button
                        onClick={async () => {
                          await signOut();
                          setIsMenuOpen(false);
                          navigate('/', { replace: true });
                        }}
                        className="w-full px-4 py-3 rounded-xl text-gray-600 hover:text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 text-center font-medium relative z-10"
                      >
                        Esci
                      </button>
                    </div>
                  ) : !loading ? (
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-brand-burgundy hover:bg-brand-burgundy/10 transition-all duration-300 text-center font-medium relative z-10"
                    >
                      Accedi
                    </Link>
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </header>
  );
};

export default Header;