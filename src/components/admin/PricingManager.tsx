import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingConfig {
  id: string;
  subscription_type: string;
  price: number;
  currency: string;
  is_active: boolean;
  updated_at: string;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  basic: 'Piano Base',
  premium: 'Piano Premium',
  complete_coaching: 'Piano Completo (Complete Coaching)',
  monthly_subscription: 'Abbonamento Mensile',
  follow_up: 'Follow-up'
};

const PricingManager: React.FC = () => {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .order('subscription_type');

      if (error) throw error;

      setPricing(data || []);
    } catch (error: any) {
      console.error('Error loading pricing:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento dei prezzi' });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (subscriptionType: string, newPrice: string) => {
    setPricing(prev =>
      prev.map(p =>
        p.subscription_type === subscriptionType
          ? { ...p, price: parseFloat(newPrice) || 0 }
          : p
      )
    );
  };

  const handleToggleActive = (subscriptionType: string) => {
    setPricing(prev =>
      prev.map(p =>
        p.subscription_type === subscriptionType
          ? { ...p, is_active: !p.is_active }
          : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      for (const config of pricing) {
        const { error } = await supabase
          .from('pricing_config')
          .update({
            price: config.price,
            is_active: config.is_active
          })
          .eq('id', config.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Prezzi aggiornati con successo!' });
      await loadPricing();
    } catch (error: any) {
      console.error('Error saving pricing:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio dei prezzi' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-brand-burgundy animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-brand-burgundy" />
            Gestione Prezzi
          </h2>
          <p className="text-gray-600 mt-1">
            Modifica i prezzi dei piani di abbonamento
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-brand-burgundy text-white rounded-lg hover:bg-brand-burgundy-dark transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salva Modifiche
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Piano
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Prezzo (€)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Stato
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Ultimo Aggiornamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pricing.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {SUBSCRIPTION_LABELS[config.subscription_type] || config.subscription_type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {config.subscription_type}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={config.price}
                        onChange={(e) => handlePriceChange(config.subscription_type, e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(config.subscription_type)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        config.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {config.is_active ? 'Attivo' : 'Disattivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(config.updated_at).toLocaleString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Nota Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>I prezzi modificati verranno applicati ai nuovi ordini</li>
              <li>Gli ordini esistenti mantengono il prezzo al momento dell'acquisto</li>
              <li>Assicurati di aggiornare anche i prezzi su Stripe se necessario</li>
              <li>Il piano "complete_coaching" è quello che vedi come "Abbonamento complete"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingManager;
