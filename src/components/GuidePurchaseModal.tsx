import { useState } from 'react';
import { X, Loader, Lock, Download, CreditCard, FileText, CheckCircle, Tag, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GuidePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: {
    id: string;
    title: string;
    price: number;
    cover_image_url?: string;
  };
}

export default function GuidePurchaseModal({
  isOpen,
  onClose,
  guide
}: GuidePurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    billing_name: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'IT',
    vat_number: '',
    fiscal_code: '',
    is_company: false,
    coupon_code: '',
  });

  const [couponValidating, setCouponValidating] = useState(false);
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateCoupon = async () => {
    if (!formData.coupon_code.trim()) {
      setCouponError('');
      setCouponApplied(null);
      return;
    }

    setCouponValidating(true);
    setCouponError('');

    try {
      const { data, error } = await supabase.rpc('validate_and_calculate_coupon', {
        p_coupon_code: formData.coupon_code.trim().toUpperCase(),
        p_service_type: 'guide',
        p_original_amount: guide.price
      });

      if (error) throw error;

      if (data && data.valid) {
        setCouponApplied({
          is_valid: true,
          discount_type: data.discount_type,
          discount_percentage: data.discount_type === 'percentage' ? data.discount_value : 0,
          discount_amount: data.discount_amount,
          final_amount: data.final_amount,
          message: data.message
        });
        setCouponError('');
      } else {
        setCouponError(data?.message || 'Codice coupon non valido');
        setCouponApplied(null);
      }
    } catch (err: any) {
      console.error('Coupon validation error:', err);
      setCouponError('Errore nella validazione del coupon');
      setCouponApplied(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.full_name) {
      setError('Inserisci email e nome completo');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email non valida');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.billing_name || !formData.billing_address ||
        !formData.billing_city || !formData.billing_postal_code) {
      setError('Compila tutti i campi obbligatori di fatturazione');
      return false;
    }
    if (formData.is_company && !formData.vat_number) {
      setError('Inserisci la Partita IVA per fatturazione aziendale');
      return false;
    }
    if (!formData.is_company && !formData.fiscal_code) {
      setError('Inserisci il Codice Fiscale');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleCheckout();
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-guide-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            contentId: guide.id,
            email: formData.email,
            fullName: formData.full_name,
            phone: formData.phone,
            couponCode: couponApplied ? formData.coupon_code.trim().toUpperCase() : null,
            billingData: {
              billing_name: formData.billing_name,
              billing_address: formData.billing_address,
              billing_city: formData.billing_city,
              billing_postal_code: formData.billing_postal_code,
              billing_country: formData.billing_country,
              vat_number: formData.vat_number,
              fiscal_code: formData.fiscal_code,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il pagamento');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Errore durante il checkout');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Acquista {guide.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {step} di 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Info Box */}
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-6 border border-teal-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  Cosa succede dopo l'acquisto?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Download className="w-4 h-4 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Accesso immediato al download della guida in PDF</span>
                  </li>
                  <li className="flex items-start">
                    <Lock className="w-4 h-4 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Verrà creato automaticamente un account personale</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="w-4 h-4 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Potrai accedere alla tua libreria e alle fatture quando vuoi</span>
                  </li>
                  <li className="flex items-start">
                    <CreditCard className="w-4 h-4 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Riceverai la fattura via email e nella tua area riservata</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: User Data */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tua@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Riceverai la guida e le credenziali di accesso a questa email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome e Cognome *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Mario Rossi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono (opzionale)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+39 123 456 7890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>

              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Coupon (opzionale)
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      name="coupon_code"
                      value={formData.coupon_code}
                      onChange={handleInputChange}
                      placeholder="SCONTO20"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent uppercase"
                    />
                    <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={validateCoupon}
                    disabled={!formData.coupon_code.trim() || couponValidating}
                    className="px-6 py-3 bg-brand-burgundy text-white rounded-lg font-semibold hover:bg-brand-burgundy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {couponValidating ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      'Applica'
                    )}
                  </button>
                </div>

                {couponError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {couponError}
                  </p>
                )}

                {couponApplied && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-semibold flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Coupon applicato con successo!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {couponApplied.message || `Sconto di €${couponApplied.discount_amount?.toFixed(2)} applicato!`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Billing Data */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  name="is_company"
                  id="is_company"
                  checked={formData.is_company}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
                />
                <label htmlFor="is_company" className="text-sm font-medium text-gray-700">
                  Fatturazione aziendale (con Partita IVA)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.is_company ? 'Ragione Sociale *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  name="billing_name"
                  value={formData.billing_name}
                  onChange={handleInputChange}
                  placeholder={formData.is_company ? 'Es: Studio Nutrizionale SRL' : formData.full_name}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
              </div>

              {formData.is_company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partita IVA *
                  </label>
                  <input
                    type="text"
                    name="vat_number"
                    value={formData.vat_number}
                    onChange={handleInputChange}
                    placeholder="IT12345678901"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    required={formData.is_company}
                  />
                </div>
              )}

              {!formData.is_company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    name="fiscal_code"
                    value={formData.fiscal_code}
                    onChange={handleInputChange}
                    placeholder="RSSMRA80A01H501U"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    required={!formData.is_company}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo *
                </label>
                <input
                  type="text"
                  name="billing_address"
                  value={formData.billing_address}
                  onChange={handleInputChange}
                  placeholder="Via Roma 123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città *
                  </label>
                  <input
                    type="text"
                    name="billing_city"
                    value={formData.billing_city}
                    onChange={handleInputChange}
                    placeholder="Roma"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAP *
                  </label>
                  <input
                    type="text"
                    name="billing_postal_code"
                    value={formData.billing_postal_code}
                    onChange={handleInputChange}
                    placeholder="00100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">{guide.title}</span>
              <span className="font-semibold text-gray-900">€{guide.price.toFixed(2)}</span>
            </div>

            {couponApplied && (
              <div className="flex items-center justify-between mb-2 text-green-600">
                <span className="flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Sconto ({formData.coupon_code.toUpperCase()})
                </span>
                <span className="font-semibold">
                  -€{couponApplied.discount_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Totale</span>
                <span className="font-bold text-2xl text-brand-burgundy">
                  €{couponApplied
                    ? couponApplied.final_amount?.toFixed(2) || guide.price.toFixed(2)
                    : guide.price.toFixed(2)
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Indietro
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Elaborazione...</span>
                </div>
              ) : step === 1 ? (
                'Continua'
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Procedi al Pagamento</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
