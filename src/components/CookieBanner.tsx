import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings, Shield, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = () => {
    const savedConsent = localStorage.getItem('cookie_consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      const parsed = JSON.parse(savedConsent);
      setConsent(parsed);
      applyCookieConsent(parsed);
    }
  };

  const saveConsent = async (consentData: CookieConsent) => {
    const consentRecord = {
      consent_date: new Date().toISOString(),
      necessary: consentData.necessary,
      functional: consentData.functional,
      analytics: consentData.analytics,
      marketing: consentData.marketing,
      ip_address: null // Privacy-friendly: non tracciamo l'IP
    };

    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());

    // Se l'utente è loggato, salva anche nel database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_consents').upsert({
        user_id: user.id,
        ...consentRecord
      });
    }

    applyCookieConsent(consentData);
    setShowBanner(false);
    setShowSettings(false);
  };

  const applyCookieConsent = (consentData: CookieConsent) => {
    // Qui puoi integrare Google Analytics, Facebook Pixel, etc. basandoti sul consenso
    if (consentData.analytics) {
      // Abilita Google Analytics
      console.log('Analytics enabled');
    }
    if (consentData.marketing) {
      // Abilita Marketing cookies
      console.log('Marketing cookies enabled');
    }
  };

  const acceptAll = () => {
    const allConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    saveConsent(allConsent);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    saveConsent(necessaryOnly);
  };

  const saveCustom = () => {
    saveConsent(consent);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
        <div className="container-custom py-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {!showSettings ? (
              // Simple Banner
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Utilizzo dei Cookie
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza,
                        personalizzare contenuti e analizzare il traffico. Puoi scegliere quali
                        cookie accettare. I cookie necessari sono sempre attivi per garantire il
                        funzionamento del sito.
                      </p>
                      <div className="flex flex-wrap gap-3 mt-4">
                        <a
                          href="/privacy-policy"
                          className="text-brand-burgundy font-medium hover:underline text-sm"
                        >
                          Privacy Policy
                        </a>
                        <span className="text-gray-300">•</span>
                        <a
                          href="/cookie-policy"
                          className="text-brand-burgundy font-medium hover:underline text-sm"
                        >
                          Cookie Policy
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:flex-shrink-0">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Settings className="w-5 h-5" />
                      Personalizza
                    </button>
                    <button
                      onClick={acceptNecessary}
                      className="px-6 py-3 border-2 border-brand-burgundy text-brand-burgundy font-semibold rounded-xl hover:bg-brand-burgundy/5 transition-colors duration-200"
                    >
                      Solo Necessari
                    </button>
                    <button
                      onClick={acceptAll}
                      className="px-6 py-3 bg-gradient-to-r from-brand-burgundy to-brand-pink text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Accetta Tutti
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Settings Panel
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-burgundy to-brand-pink rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Impostazioni Cookie
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Necessary Cookies */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <h4 className="font-bold text-gray-900">Cookie Necessari</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                            Sempre Attivi
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Questi cookie sono essenziali per il funzionamento del sito. Includono
                          l'autenticazione, la sicurezza e le preferenze di base. Non possono essere
                          disabilitati.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">Cookie Funzionali</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Permettono funzionalità avanzate come la chat, i video e le preferenze
                          personalizzate. Il sito funziona anche senza questi cookie, ma con
                          funzionalità limitate.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setConsent({...consent, functional: !consent.functional})}
                          className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                            consent.functional ? 'bg-brand-burgundy justify-end' : 'bg-gray-300 justify-start'
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">Cookie Analitici</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo
                          informazioni anonime. Usiamo questi dati per migliorare l'esperienza utente.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setConsent({...consent, analytics: !consent.analytics})}
                          className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                            consent.analytics ? 'bg-brand-burgundy justify-end' : 'bg-gray-300 justify-start'
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">Cookie di Marketing</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Utilizzati per mostrare pubblicità pertinenti e misurare l'efficacia delle
                          campagne. Possono tracciare la tua navigazione su altri siti.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setConsent({...consent, marketing: !consent.marketing})}
                          className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                            consent.marketing ? 'bg-brand-burgundy justify-end' : 'bg-gray-300 justify-start'
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={acceptNecessary}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Solo Necessari
                  </button>
                  <button
                    onClick={saveCustom}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-burgundy to-brand-pink text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Salva Preferenze
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
