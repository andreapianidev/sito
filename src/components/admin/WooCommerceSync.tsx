import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, Link, CheckCircle, XCircle, AlertCircle, Play, Pause, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WooSettings {
  id: string;
  store_name: string;
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
  webhook_secret: string;
  sync_enabled: boolean;
  sync_products: boolean;
  last_sync_at: string;
}

interface ProductMapping {
  id: string;
  local_product_id: string;
  woocommerce_product_id: number;
  woocommerce_sku: string;
  sync_direction: string;
  sync_status: string;
  last_synced_at: string;
  last_error: string;
  bio_products: {
    name: string;
    price: number;
    stock: number;
  };
}

interface SyncLog {
  id: string;
  operation_type: string;
  direction: string;
  status: string;
  error_message: string;
  created_at: string;
  woocommerce_id: number;
}

export default function WooCommerceSync() {
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'logs'>('settings');
  const [settings, setSettings] = useState<WooSettings | null>(null);
  const [products, setProducts] = useState<ProductMapping[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'settings') {
        const { data } = await supabase
          .from('woocommerce_settings')
          .select('*')
          .single();
        setSettings(data);
      } else if (activeTab === 'products') {
        const { data } = await supabase
          .from('woocommerce_products_mapping')
          .select(`
            *,
            bio_products(name, price, stock)
          `)
          .order('last_synced_at', { ascending: false });
        setProducts(data || []);
      } else if (activeTab === 'logs') {
        const { data } = await supabase
          .from('woocommerce_sync_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('woocommerce_settings')
        .upsert(settings);

      if (error) throw error;

      alert('Impostazioni salvate con successo!');
      setEditMode(false);
    } catch (err: any) {
      alert('Errore nel salvataggio: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncProduct = async (productId: string, action: string = 'update') => {
    try {
      setSyncing(true);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-to-woocommerce`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ product_id: productId, action }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante la sincronizzazione');
      }

      alert('Prodotto sincronizzato con successo!');
      loadData();
    } catch (err: any) {
      alert('Errore: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async () => {
    if (!settings) return;

    const newSettings = { ...settings, sync_enabled: !settings.sync_enabled };
    setSettings(newSettings);

    const { error } = await supabase
      .from('woocommerce_settings')
      .update({ sync_enabled: newSettings.sync_enabled })
      .eq('id', settings.id);

    if (error) {
      alert('Errore nell\'aggiornamento');
      setSettings(settings);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sincronizzazione WooCommerce</h2>
        {settings && (
          <button
            onClick={handleToggleSync}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              settings.sync_enabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {settings.sync_enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {settings.sync_enabled ? 'Sync Attiva' : 'Sync Disattivata'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'settings'
              ? 'border-b-2 border-rose-500 text-rose-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Impostazioni
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'products'
              ? 'border-b-2 border-rose-500 text-rose-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Link className="w-4 h-4 inline mr-2" />
          Prodotti Mappati ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'logs'
              ? 'border-b-2 border-rose-500 text-rose-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Log Sincronizzazioni
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {!settings && !loading && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Nessuna configurazione WooCommerce trovata</p>
              <button
                onClick={() => setSettings({
                  id: '',
                  store_name: 'FarmaNatura',
                  store_url: '',
                  consumer_key: '',
                  consumer_secret: '',
                  webhook_secret: '',
                  sync_enabled: false,
                  sync_products: true,
                  last_sync_at: ''
                })}
                className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600"
              >
                Crea Configurazione
              </button>
            </div>
          )}

          {settings && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Store
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Store WooCommerce
                  </label>
                  <input
                    type="url"
                    value={settings.store_url}
                    onChange={(e) => setSettings({ ...settings, store_url: e.target.value })}
                    disabled={!editMode}
                    placeholder="https://farmanatura.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumer Key
                  </label>
                  <input
                    type="text"
                    value={settings.consumer_key}
                    onChange={(e) => setSettings({ ...settings, consumer_key: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumer Secret
                  </label>
                  <input
                    type="password"
                    value={settings.consumer_secret}
                    onChange={(e) => setSettings({ ...settings, consumer_secret: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret (opzionale)
                </label>
                <input
                  type="text"
                  value={settings.webhook_secret || ''}
                  onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">URL Webhook da configurare in WooCommerce:</h4>
                <code className="text-sm bg-white px-3 py-2 rounded border border-blue-300 block">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/woocommerce-webhook
                </code>
                <p className="text-sm text-blue-700 mt-2">
                  Configura questo URL nei webhook di WooCommerce per ricevere aggiornamenti automatici
                </p>
              </div>

              <div className="flex gap-3">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600"
                  >
                    Modifica Impostazioni
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                    >
                      {saving ? 'Salvataggio...' : 'Salva'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        loadData();
                      }}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Annulla
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Link className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nessun prodotto mappato</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prodotto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">WooCommerce ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Direzione</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ultima Sync</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.bio_products.name}</div>
                      <div className="text-sm text-gray-500">
                        €{product.bio_products.price} - Stock: {product.bio_products.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      #{product.woocommerce_product_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {product.sync_direction}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.sync_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : product.sync_status === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.sync_status === 'active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {product.sync_status === 'error' && <XCircle className="w-3 h-3 inline mr-1" />}
                        {product.sync_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.last_synced_at
                        ? new Date(product.last_synced_at).toLocaleString('it-IT')
                        : 'Mai'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSyncProduct(product.local_product_id)}
                        disabled={syncing}
                        className="text-rose-600 hover:text-rose-700 font-medium text-sm hover:underline disabled:text-gray-400"
                      >
                        <RefreshCw className="w-4 h-4 inline mr-1" />
                        Sync
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nessun log disponibile</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data/Ora</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Operazione</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Direzione</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dettagli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.operation_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.direction}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : log.status === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.error_message || 'OK'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
