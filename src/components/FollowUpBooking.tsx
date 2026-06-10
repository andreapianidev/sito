import React, { useState, useEffect } from 'react';
import { Gift, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import BookingModal from './BookingModal';

interface FollowUpEligibility {
  has_free_followup: boolean;
  remaining_followups: number;
  subscription_type: string;
  subscription_active: boolean;
}

export default function FollowUpBooking() {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<FollowUpEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkEligibility();
    }
  }, [user]);

  const checkEligibility = async () => {
    try {
      const { data, error } = await supabase
        .rpc('check_followup_eligibility', { p_user_id: user?.id });

      if (error) throw error;
      setEligibility(data);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!eligibility?.subscription_active) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Abbonamento Inattivo</h3>
        <p className="text-yellow-700">
          Devi avere un abbonamento attivo per prenotare un follow-up.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prenota Follow-Up</h2>

          {eligibility.has_free_followup ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Gift className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 text-lg">
                    Hai {eligibility.remaining_followups} follow-up {eligibility.remaining_followups === 1 ? 'gratuito' : 'gratuiti'} disponibili!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Inclusi nel tuo piano {eligibility.subscription_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Prenota Follow-Up Gratuito
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg">
                    Follow-Up a Pagamento
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Costo: €47 - Durata: 30 minuti
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Hai esaurito i follow-up gratuiti inclusi nel tuo piano
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Prenota Follow-Up (€47)
              </button>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Cosa include il Follow-Up:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Verifica obiettivi raggiunti e progressi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Aggiornamento piano alimentare personalizzato</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Risoluzione dubbi e difficoltà</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Motivazione e supporto personalizzato</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Nuove ricette stagionali</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Aggiustamenti basati sui risultati</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          selectedService={{ id: 'follow-up' }}
        />
      )}
    </>
  );
}
