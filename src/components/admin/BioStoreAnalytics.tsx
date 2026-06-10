import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, ShoppingCart, Eye, DollarSign, Users, Package, Calendar, CheckCircle, Clock } from 'lucide-react';

interface TrackingEvent {
  id: string;
  user_id: string | null;
  action_type: string;
  product_ids: string[];
  product_names: string[];
  total_amount: number;
  coupon_code: string;
  session_id: string;
  created_at: string;
}

interface ProductStats {
  product_name: string;
  views: number;
  cart_adds: number;
  checkouts: number;
}

interface ConversionStats {
  total_checkouts: number;
  total_orders: number;
  conversion_rate: number;
  total_revenue: number;
  avg_order_value: number;
}

interface Order {
  id: string;
  woocommerce_order_id: number;
  order_number: string;
  status: string;
  total: number;
  customer_name: string;
  customer_email: string;
  used_biostore_coupon: boolean;
  date_created: string;
  line_items: any[];
}

const BioStoreAnalytics: React.FC = () => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    // Load tracking events (clicks, checkouts)
    const { data: trackingData } = await supabase
      .from('bio_store_tracking')
      .select('*')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Load completed orders from WooCommerce
    const { data: ordersData } = await supabase
      .from('bio_store_orders')
      .select('*')
      .gte('date_created', daysAgo.toISOString())
      .order('date_created', { ascending: false });

    // Load conversion stats
    const { data: stats } = await supabase
      .rpc('get_bio_store_conversion_stats', {
        p_start_date: daysAgo.toISOString(),
        p_end_date: new Date().toISOString()
      })
      .single();

    const { data: settings } = await supabase
      .from('bio_store_settings')
      .select('*')
      .single();

    if (trackingData) setEvents(trackingData);
    if (ordersData) setOrders(ordersData);
    if (stats) setConversionStats(stats);
    if (settings) setStoreSettings(settings);

    setLoading(false);
  };

  const getTotalStats = () => {
    const views = events.filter(e => e.action_type === 'product_view').length;
    const cartAdds = events.filter(e => e.action_type === 'add_to_cart').length;
    const checkouts = events.filter(e => e.action_type === 'checkout_started').length;
    const totalRevenue = events
      .filter(e => e.action_type === 'checkout_started')
      .reduce((sum, e) => sum + (e.total_amount || 0), 0);

    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;

    return { views, cartAdds, checkouts, totalRevenue, uniqueSessions, uniqueUsers };
  };

  const getProductStats = (): ProductStats[] => {
    const productMap = new Map<string, ProductStats>();

    events.forEach(event => {
      if (event.product_names && Array.isArray(event.product_names)) {
        event.product_names.forEach(productName => {
          if (!productMap.has(productName)) {
            productMap.set(productName, {
              product_name: productName,
              views: 0,
              cart_adds: 0,
              checkouts: 0
            });
          }

          const stats = productMap.get(productName)!;
          if (event.action_type === 'product_view') stats.views++;
          if (event.action_type === 'add_to_cart') stats.cart_adds++;
          if (event.action_type === 'checkout_started') stats.checkouts++;
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => (b.views + b.cart_adds + b.checkouts) - (a.views + a.cart_adds + a.checkouts));
  };

  const stats = getTotalStats();
  const productStats = getProductStats();

  const conversionRate = stats.views > 0 ? ((stats.checkouts / stats.views) * 100).toFixed(1) : '0';
  const cartConversionRate = stats.cartAdds > 0 ? ((stats.checkouts / stats.cartAdds) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Shop Online</h2>
          {storeSettings && (
            <p className="text-sm text-gray-600 mt-1">
              Tracking coupon: <span className="font-mono font-bold text-green-600">{storeSettings.coupon_code}</span>
            </p>
          )}
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
        >
          <option value="1">Ultime 24 ore</option>
          <option value="7">Ultimi 7 giorni</option>
          <option value="30">Ultimi 30 giorni</option>
          <option value="90">Ultimi 90 giorni</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.views}</span>
          </div>
          <p className="text-blue-100 font-medium">Visualizzazioni Prodotti</p>
          <p className="text-xs text-blue-200 mt-1">Click su "Acquista Ora"</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.cartAdds}</span>
          </div>
          <p className="text-purple-100 font-medium">Aggiunti al Carrello</p>
          <p className="text-xs text-purple-200 mt-1">Prodotti aggiunti</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.checkouts}</span>
          </div>
          <p className="text-green-100 font-medium">Checkout Iniziati</p>
          <p className="text-xs text-green-200 mt-1">Con coupon {storeSettings?.coupon_code}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">€{stats.totalRevenue.toFixed(0)}</span>
          </div>
          <p className="text-orange-100 font-medium">Valore Checkout</p>
          <p className="text-xs text-orange-200 mt-1">Totale carrelli inviati</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Tasso di Conversione</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-green-600 mb-2">{conversionRate}%</p>
          <p className="text-sm text-gray-600">Da visualizzazione a checkout</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Carrello → Checkout</h3>
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-4xl font-bold text-purple-600 mb-2">{cartConversionRate}%</p>
          <p className="text-sm text-gray-600">Da carrello a checkout</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Visitatori Unici</h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-4xl font-bold text-blue-600 mb-2">{stats.uniqueSessions}</p>
          <p className="text-sm text-gray-600">{stats.uniqueUsers} utenti loggati</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-6 h-6 text-gray-700" />
          <h3 className="text-xl font-bold text-gray-900">Statistiche per Prodotto</h3>
        </div>

        {productStats.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nessun dato disponibile per il periodo selezionato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Prodotto</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>Visualizzazioni</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Carrello</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Checkout</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Conversione</th>
                </tr>
              </thead>
              <tbody>
                {productStats.slice(0, 15).map((product, index) => {
                  const productConversion = product.views > 0
                    ? ((product.checkouts / product.views) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{product.product_name}</td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                          {product.views}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                          {product.cart_adds}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                          {product.checkouts}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-bold ${
                          parseFloat(productConversion) > 10 ? 'text-green-600' :
                          parseFloat(productConversion) > 5 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {productConversion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {conversionStats && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-xl">
          <h3 className="text-xl font-bold mb-4">Conversione Completa (Click → Ordine Pagato)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Checkout Iniziati</p>
              <p className="text-4xl font-bold">{conversionStats.total_checkouts}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Ordini Completati</p>
              <p className="text-4xl font-bold">{conversionStats.total_orders}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Tasso Conversione</p>
              <p className="text-4xl font-bold">{conversionStats.conversion_rate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Revenue Totale</p>
              <p className="text-4xl font-bold">€{conversionStats.total_revenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Ordini Completati da FarmaNatura</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ordine</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Totale</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Coupon</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.order_number}</p>
                        <p className="text-xs text-gray-500">WC ID: {order.woocommerce_order_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-gray-900">
                      €{order.total.toFixed(2)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {order.used_biostore_coupon ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          ✓ {storeSettings?.coupon_code}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">
                      {new Date(order.date_created).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Ordini tracciati:</strong> {orders.filter(o => o.used_biostore_coupon).length} ordini hanno usato il coupon <strong>{storeSettings?.coupon_code}</strong> e provengono sicuramente dal tuo Shop Online.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 rounded-full p-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Come funziona il tracking completo</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>Utente clicca "Acquista Ora" sul tuo Shop Online → <strong>Registrato come checkout</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Utente viene reindirizzato a FarmaNatura con coupon <strong>{storeSettings?.coupon_code}</strong> già applicato</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>Utente completa il pagamento su FarmaNatura</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>FarmaNatura invia webhook al tuo sistema con i dettagli dell'ordine</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">5.</span>
                <span>Il sistema salva l'ordine e <strong>notifica l'utente</strong> quando l'ordine viene spedito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Puoi vedere esattamente quale % di click si trasforma in ordini pagati!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {events.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-gray-700" />
            <h3 className="text-xl font-bold text-gray-900">Attività Recente</h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.slice(0, 50).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  {event.action_type === 'product_view' && <Eye className="w-5 h-5 text-blue-600" />}
                  {event.action_type === 'add_to_cart' && <ShoppingCart className="w-5 h-5 text-purple-600" />}
                  {event.action_type === 'checkout_started' && <TrendingUp className="w-5 h-5 text-green-600" />}

                  <div>
                    <p className="font-medium text-gray-900">
                      {event.action_type === 'product_view' && 'Prodotto visualizzato'}
                      {event.action_type === 'add_to_cart' && 'Aggiunto al carrello'}
                      {event.action_type === 'checkout_started' && 'Checkout iniziato'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.product_names && event.product_names.length > 0
                        ? event.product_names.join(', ')
                        : 'Prodotti non specificati'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {event.total_amount > 0 && (
                    <p className="font-bold text-green-600">€{event.total_amount.toFixed(2)}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BioStoreAnalytics;
