import { X, Check, Zap, Star } from 'lucide-react';

export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cycle: BillingCycle) => void;
}

const MONTHLY_PRICE = 5.99;
const QUARTERLY_PRICE = 14.99;
const SEMIANNUAL_PRICE = 27.99;

const quarterlyMonthlyEquiv = (QUARTERLY_PRICE / 3).toFixed(2);
const semiannualMonthlyEquiv = (SEMIANNUAL_PRICE / 6).toFixed(2);
const quarterlyDiscount = Math.round((1 - QUARTERLY_PRICE / (MONTHLY_PRICE * 3)) * 100);
const semiannualDiscount = Math.round((1 - SEMIANNUAL_PRICE / (MONTHLY_PRICE * 6)) * 100);

export default function PlanUpgradeModal({ isOpen, onClose, onSelect }: PlanUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-8 pb-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Zap className="h-3.5 w-3.5" />
            OFFERTA SPECIALE
          </div>
          <h2 className="text-xl font-bold">Risparmia abbonandoti per piu' mesi</h2>
          <p className="text-teal-100 text-sm mt-1">Scegli la durata che preferisci — puoi sempre cambiare idea</p>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">

          {/* Quarterly */}
          <button
            onClick={() => onSelect('quarterly')}
            className="w-full group relative border-2 border-teal-500 bg-teal-50 hover:bg-teal-100 rounded-xl p-4 text-left transition-all hover:shadow-md"
          >
            <div className="absolute -top-2.5 left-4">
              <span className="bg-teal-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" />
                PIU' POPOLARE — RISPARMIA {quarterlyDiscount}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="font-bold text-gray-900 text-base">Abbonamento Trimestrale</p>
                <p className="text-sm text-gray-600 mt-0.5">3 mesi di menu settimanali personalizzati</p>
                <div className="flex items-center gap-2 mt-2">
                  {[
                    '12 menu settimanali',
                    'Lista spesa inclusa',
                    'Cancellabile in qualsiasi momento',
                  ].map(f => (
                    <span key={f} className="hidden sm:flex items-center gap-1 text-xs text-teal-700">
                      <Check className="h-3 w-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-2xl font-bold text-teal-700">€{QUARTERLY_PRICE}</p>
                <p className="text-xs text-gray-500">€{quarterlyMonthlyEquiv}/mese</p>
                <p className="text-xs line-through text-gray-400">€{(MONTHLY_PRICE * 3).toFixed(2)}</p>
              </div>
            </div>
          </button>

          {/* Semiannual */}
          <button
            onClick={() => onSelect('semiannual')}
            className="w-full group relative border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 rounded-xl p-4 text-left transition-all hover:shadow-md"
          >
            <div className="absolute -top-2.5 left-4">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="h-3 w-3" />
                MIGLIOR RISPARMIO — RISPARMIA {semiannualDiscount}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="font-bold text-gray-900 text-base">Abbonamento Semestrale</p>
                <p className="text-sm text-gray-600 mt-0.5">6 mesi di menu settimanali personalizzati</p>
                <div className="flex items-center gap-2 mt-2">
                  {[
                    '24 menu settimanali',
                    'Lista spesa inclusa',
                    'Cancellabile in qualsiasi momento',
                  ].map(f => (
                    <span key={f} className="hidden sm:flex items-center gap-1 text-xs text-amber-700">
                      <Check className="h-3 w-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-2xl font-bold text-amber-700">€{SEMIANNUAL_PRICE}</p>
                <p className="text-xs text-gray-500">€{semiannualMonthlyEquiv}/mese</p>
                <p className="text-xs line-through text-gray-400">€{(MONTHLY_PRICE * 6).toFixed(2)}</p>
              </div>
            </div>
          </button>

          {/* Monthly fallback */}
          <button
            onClick={() => onSelect('monthly')}
            className="w-full border border-gray-200 hover:border-gray-300 rounded-xl p-4 text-left transition-all hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">Continua con il Mensile</p>
                <p className="text-sm text-gray-500 mt-0.5">Rinnovo automatico ogni mese</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-xl font-bold text-gray-600">€{MONTHLY_PRICE}</p>
                <p className="text-xs text-gray-400">/mese</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-5 px-5">
          Tutti i piani si rinnovano automaticamente. Puoi cancellare in qualsiasi momento dalle impostazioni.
        </p>
      </div>
    </div>
  );
}
