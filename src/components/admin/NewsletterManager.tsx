import React, { useState, useEffect } from 'react';
import { Mail, Download, Trash2, Search, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  subscribed_at: string;
  is_active: boolean;
}

const NewsletterManager = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error loading subscribers:', error);
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Nome', 'Fonte', 'Data Iscrizione', 'Attivo'];
    const csvData = filteredSubscribers.map(sub => [
      sub.email,
      sub.name || '',
      sub.source,
      new Date(sub.subscribed_at).toLocaleDateString('it-IT'),
      sub.is_active ? 'Sì' : 'No'
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      loadSubscribers();
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo iscritto?')) return;

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (!error) {
      loadSubscribers();
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = sourceFilter === 'all' || sub.source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const sources = ['all', ...Array.from(new Set(subscribers.map(s => s.source)))];
  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Iscritti Newsletter</h2>
          <p className="text-gray-600 mt-1">
            {activeCount} iscritti attivi su {subscribers.length} totali
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Esporta CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per email o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            >
              <option value="all">Tutte le fonti</option>
              {sources.slice(1).map(source => (
                <option key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-burgundy border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Caricamento...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessun iscritto trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fonte</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stato</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{subscriber.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{subscriber.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {subscriber.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(subscriber.subscribed_at).toLocaleDateString('it-IT')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(subscriber.id, subscriber.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subscriber.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {subscriber.is_active ? 'Attivo' : 'Inattivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteSubscriber(subscriber.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Come Utilizzare i Dati</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Esporta i contatti in CSV per importarli nel tuo tool di email marketing</li>
              <li>• Gli iscritti da "biostore" sono interessati ai prodotti naturali</li>
              <li>• Usa i filtri per segmentare il pubblico per campagne mirate</li>
              <li>• Puoi disattivare iscritti senza eliminarli dal database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterManager;
