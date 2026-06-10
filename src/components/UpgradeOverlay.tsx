import React, { useState } from 'react';
import { X, Lock, Check, Zap, Crown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUpgradeOptions, getPlanName } from '../utils/subscriptionFeatures';
import BookingModal from './BookingModal';
import MonthlySubscriptionSignup from './MonthlySubscriptionSignup';
import PlanUpgradeModal, { type BillingCycle } from './PlanUpgradeModal';
import { supabase } from '../lib/supabase';

interface UpgradeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string | undefined;
  lockedFeatureName: string;
  requiredPlan?: string;
}

const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({
  isOpen,
  onClose,
  currentPlan,
  lockedFeatureName,
  requiredPlan = 'premium'
}) => {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // If monthly subscription is required (expired), show renewal option
  const isExpiredMonthly = requiredPlan === 'monthly_subscription' && currentPlan === 'monthly_subscription';

  const upgradeOptions = isExpiredMonthly
    ? [{
        id: 'monthly_subscription',
        title: 'Rinnova Abbonamento Mensile',
        price: 5.99,
        validityDays: 30,
        benefits: [
          '4 menù settimanali/mese',
          'Ricette stagionali',
          'Lista spesa automatica',
          'Rinnovo automatico',
          'Cancellabile quando vuoi'
        ]
      }]
    : getUpgradeOptions(currentPlan);

  const currentPlanName = getPlanName(currentPlan);

  // Service definitions for booking modal
  const serviceDefinitions: Record<string, any> = {
    basic: {
      id: 'basic',
      title: 'Consulenza Semplice',
      price: 97,
      duration: 60,
      validityDays: 30,
    },
    premium: {
      id: 'premium',
      title: 'Consulenza Migliorata',
      price: 197,
      duration: 90,
      validityDays: 90,
    },
    complete: {
      id: 'complete',
      title: 'Consulenza Completa',
      price: 297,
      duration: 120,
      validityDays: 180,
    }
  };

  const handleUpgradeSelect = (cycle: BillingCycle) => {
    setSelectedBillingCycle(cycle);
    setIsUpgradeModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const handleUpgradeClick = (optionId: string) => {
    if (optionId === 'monthly_subscription') {
      setIsUpgradeModalOpen(true);
    } else if (serviceDefinitions[optionId]) {
      // Open booking modal for service
      setSelectedService(serviceDefinitions[optionId]);
      setIsBookingModalOpen(true);
    } else {
      // Fallback to services page
      navigate('/servizi');
      onClose();
    }
  };

  const handleSignupSuccess = async (userId: string, userEmail: string, userName: string, couponCode?: string, billingCycle?: BillingCycle) => {
    setIsSignupModalOpen(false);
    await proceedToCheckout(userId, userEmail, userName, couponCode, billingCycle ?? selectedBillingCycle);
  };

  const proceedToCheckout = async (userId: string, userEmail: string, userName: string, couponCode?: string, billingCycle: BillingCycle = 'monthly') => {
    try {
      setIsProcessing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sessione scaduta. Effettua di nuovo il login.');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            serviceType: 'monthly_subscription',
            billingCycle,
            userId,
            userEmail,
            userName,
            addFollowUps: false,
            appointmentId: null,
            couponCode: couponCode || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione della sessione di pagamento');
      }

      const data = await response.json();
      const { url } = data;

      if (!url) {
        throw new Error('URL di pagamento non ricevuto dal server');
      }

      window.location.href = url;

    } catch (error: any) {
      console.error('Error creating subscription:', error);
      alert('Errore durante la creazione dell\'abbonamento: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 pb-6 bg-gradient-to-br from-brand-burgundy to-brand-pink text-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Funzionalità Bloccata</h2>
              <p className="text-white/90 mt-1">Effettua l'upgrade per sbloccare</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Feature Locked Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {lockedFeatureName}
                </h3>
                <p className="text-gray-600">
                  {isExpiredMonthly ? (
                    <>
                      Il tuo abbonamento mensile è scaduto. Rinnova per continuare ad accedere ai menù settimanali.
                    </>
                  ) : (
                    <>
                      Questa funzionalità non è disponibile nel tuo piano attuale (<strong>{currentPlanName}</strong>).
                      {requiredPlan && requiredPlan !== 'monthly_subscription' && ` È richiesto almeno il ${getPlanName(requiredPlan)}.`}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade Options */}
          {upgradeOptions.length > 0 ? (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {isExpiredMonthly ? 'Rinnova il tuo abbonamento' : 'Scegli il tuo upgrade'}
              </h3>

              <div className="space-y-4 mb-8">
                {upgradeOptions.map((option) => (
                  <div
                    key={option.id}
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:border-brand-burgundy hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => handleUpgradeClick(option.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {option.id === 'complete' && (
                            <Crown className="w-5 h-5 text-purple-600" />
                          )}
                          {option.id === 'premium' && (
                            <Zap className="w-5 h-5 text-green-600" />
                          )}
                          {option.id === 'monthly_subscription' && (
                            <Calendar className="w-5 h-5 text-blue-600" />
                          )}
                          {option.id === 'basic' && (
                            <Check className="w-5 h-5 text-gray-600" />
                          )}
                          <h4 className="text-lg font-bold text-gray-900">
                            {option.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.id === 'monthly_subscription'
                            ? 'Solo €5.99/mese - cancella quando vuoi'
                            : currentPlan && currentPlan !== 'none' ? 'Paghi solo la differenza' : 'Piano completo'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-brand-burgundy">
                          €{option.price}
                        </div>
                        {currentPlan && currentPlan !== 'none' && option.id !== 'monthly_subscription' && (
                          <div className="text-sm text-gray-500">
                            risparmio calcolato
                          </div>
                        )}
                        {option.id === 'monthly_subscription' && (
                          <div className="text-sm text-gray-500">
                            al mese
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-2 mb-4">
                      {option.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpgradeClick(option.id);
                      }}
                      className="w-full bg-gradient-to-r from-brand-burgundy to-brand-pink text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold group-hover:scale-[1.02]"
                    >
                      <span className="relative z-10">
                        {option.id === 'monthly_subscription' && isExpiredMonthly
                          ? 'Rinnova Abbonamento'
                          : option.id === 'monthly_subscription'
                          ? 'Inizia Abbonamento Mensile'
                          : `Scegli ${option.title}`}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hai già il Piano Migliore!
              </h3>
              <p className="text-gray-600">
                Stai utilizzando il Piano Completo con tutte le funzionalità disponibili.
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-gray-50 rounded-2xl p-6 mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Hai bisogno di aiuto?
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Non sei sicuro di quale piano scegliere? Contattaci per una consulenza gratuita.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/contatti"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Contattaci
              </a>
              <a
                href="/servizi"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Confronta Piani
              </a>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            disabled={isProcessing}
          >
            Chiudi
          </button>
        </div>
      </div>

      {/* Booking Modal for service subscriptions */}
      {isBookingModalOpen && selectedService && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          service={selectedService}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSelect={handleUpgradeSelect}
      />

      {/* Monthly Subscription Signup Modal */}
      {isSignupModalOpen && (
        <MonthlySubscriptionSignup
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          onSuccess={handleSignupSuccess}
          billingCycle={selectedBillingCycle}
        />
      )}
    </div>
  );
};

export default UpgradeOverlay;
