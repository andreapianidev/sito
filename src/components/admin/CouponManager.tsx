import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, Tag, Calendar, Percent, Euro, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Coupon {
  id?: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount?: number;
  max_uses?: number;
  used_count?: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  applicable_services: string[];
}

const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [error, setError] = useState('');

  const [newCoupon, setNewCoupon] = useState<Coupon>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_amount: 0,
    max_uses: undefined,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
    applicable_services: []
  });

  const serviceTypes = [
    { id: 'basic', name: 'Consulenza Semplice' },
    { id: 'premium', name: 'Consulenza con Menù' },
    { id: 'complete', name: 'Consulenza Completa + PT' },
    { id: 'metodo_restart', name: 'Metodo Restart' },
    { id: 'follow-up', name: 'Controllo Mensile' }
  ];

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      setError('Errore nel caricamento dei coupon');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddCoupon = async () => {
    try {
      setError('');
      
      // Validation
      if (!newCoupon.code || !newCoupon.discount_value) {
        setError('Codice e valore sconto sono obbligatori');
        return;
      }

      if (newCoupon.discount_type === 'percentage' && newCoupon.discount_value > 100) {
        setError('Lo sconto percentuale non può superare il 100%');
        return;
      }

      const { error } = await supabase
        .from('coupons')
        .insert([{
          ...newCoupon,
          code: newCoupon.code.toUpperCase(),
          valid_until: newCoupon.valid_until || null,
          max_uses: newCoupon.max_uses || null
        }]);

      if (error) throw error;
      
      setIsAddingCoupon(false);
      resetNewCoupon();
      loadCoupons();
    } catch (error: any) {
      console.error('Error adding coupon:', error);
      if (error.code === '23505') {
        setError('Codice coupon già esistente');
      } else {
        setError('Errore nella creazione del coupon');
      }
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      setError('');
      
      const { error } = await supabase
        .from('coupons')
        .update({
          ...editingCoupon,
          code: editingCoupon.code.toUpperCase(),
          valid_until: editingCoupon.valid_until || null,
          max_uses: editingCoupon.max_uses || null
        })
        .eq('id', editingCoupon.id);

      if (error) throw error;
      
      setEditingCoupon(null);
      loadCoupons();
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      if (error.code === '23505') {
        setError('Codice coupon già esistente');
      } else {
        setError('Errore nell\'aggiornamento del coupon');
      }
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Errore nell\'eliminazione del coupon');
    }
  };

  const resetNewCoupon = () => {
    setNewCoupon({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_amount: 0,
      max_uses: undefined,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
      applicable_services: []
    });
  };

  const filteredCoupons = coupons.filter(coupon =>
    !searchTerm || 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (coupon: any) => {
    return coupon.valid_until && new Date(coupon.valid_until) < new Date();
  };

  const isMaxUsesReached = (coupon: any) => {
    return coupon.max_uses && coupon.used_count >= coupon.max_uses;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Coupon</h2>
          <p className="text-gray-600">Crea e gestisci codici sconto per i tuoi servizi</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca coupon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsAddingCoupon(true)}
            className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuovo Coupon</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Add/Edit Coupon Form */}
      {(isAddingCoupon || editingCoupon) && (
        <div className="bg-white rounded-2xl p-6 shadow-soft border-2 border-brand-burgundy/20">
          <h3 className="text-xl font-semibold mb-6">
            {isAddingCoupon ? 'Crea Nuovo Coupon' : 'Modifica Coupon'}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Codice Coupon *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={isAddingCoupon ? newCoupon.code : editingCoupon?.code || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (isAddingCoupon) {
                      setNewCoupon({...newCoupon, code: value});
                    } else {
                      setEditingCoupon({...editingCoupon, code: value});
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="es. SCONTO20"
                  maxLength={20}
                />
                <button
                  onClick={() => {
                    const code = generateCouponCode();
                    if (isAddingCoupon) {
                      setNewCoupon({...newCoupon, code});
                    } else {
                      setEditingCoupon({...editingCoupon, code});
                    }
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Genera
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
              <input
                type="text"
                value={isAddingCoupon ? newCoupon.description : editingCoupon?.description || ''}
                onChange={(e) => {
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, description: e.target.value});
                  } else {
                    setEditingCoupon({...editingCoupon, description: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="Descrizione del coupon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Sconto *</label>
              <select
                value={isAddingCoupon ? newCoupon.discount_type : editingCoupon?.discount_type || 'percentage'}
                onChange={(e) => {
                  const value = e.target.value as 'percentage' | 'fixed';
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, discount_type: value});
                  } else {
                    setEditingCoupon({...editingCoupon, discount_type: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              >
                <option value="percentage">Percentuale (%)</option>
                <option value="fixed">Importo Fisso (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valore Sconto *</label>
              <div className="relative">
                <input
                  type="number"
                  value={isAddingCoupon ? newCoupon.discount_value : editingCoupon?.discount_value || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (isAddingCoupon) {
                      setNewCoupon({...newCoupon, discount_value: value});
                    } else {
                      setEditingCoupon({...editingCoupon, discount_value: value});
                    }
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {(isAddingCoupon ? newCoupon.discount_type : editingCoupon?.discount_type) === 'percentage' ? '%' : '€'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Importo Minimo</label>
              <div className="relative">
                <input
                  type="number"
                  value={isAddingCoupon ? newCoupon.min_amount : editingCoupon?.min_amount || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (isAddingCoupon) {
                      setNewCoupon({...newCoupon, min_amount: value});
                    } else {
                      setEditingCoupon({...editingCoupon, min_amount: value});
                    }
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Utilizzi Massimi</label>
              <input
                type="number"
                value={isAddingCoupon ? newCoupon.max_uses || '' : editingCoupon?.max_uses || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, max_uses: value});
                  } else {
                    setEditingCoupon({...editingCoupon, max_uses: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="1"
                placeholder="Illimitato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valido Dal</label>
              <input
                type="date"
                value={isAddingCoupon ? newCoupon.valid_from : editingCoupon?.valid_from?.split('T')[0] || ''}
                onChange={(e) => {
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, valid_from: e.target.value});
                  } else {
                    setEditingCoupon({...editingCoupon, valid_from: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valido Fino Al</label>
              <input
                type="date"
                value={isAddingCoupon ? newCoupon.valid_until : editingCoupon?.valid_until?.split('T')[0] || ''}
                onChange={(e) => {
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, valid_until: e.target.value});
                  } else {
                    setEditingCoupon({...editingCoupon, valid_until: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              />
            </div>
          </div>

          {/* Applicable Services */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Servizi Applicabili</label>
            <div className="grid md:grid-cols-2 gap-3">
              {serviceTypes.map((service) => (
                <label key={service.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(isAddingCoupon ? newCoupon.applicable_services : editingCoupon?.applicable_services || []).includes(service.id)}
                    onChange={(e) => {
                      const currentServices = isAddingCoupon ? newCoupon.applicable_services : editingCoupon?.applicable_services || [];
                      const newServices = e.target.checked
                        ? [...currentServices, service.id]
                        : currentServices.filter((s: string) => s !== service.id);
                      
                      if (isAddingCoupon) {
                        setNewCoupon({...newCoupon, applicable_services: newServices});
                      } else {
                        setEditingCoupon({...editingCoupon, applicable_services: newServices});
                      }
                    }}
                    className="rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <span className="text-gray-700">{service.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Se nessun servizio è selezionato, il coupon sarà valido per tutti i servizi
            </p>
          </div>

          {/* Active Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isAddingCoupon ? newCoupon.is_active : editingCoupon?.is_active || false}
                onChange={(e) => {
                  if (isAddingCoupon) {
                    setNewCoupon({...newCoupon, is_active: e.target.checked});
                  } else {
                    setEditingCoupon({...editingCoupon, is_active: e.target.checked});
                  }
                }}
                className="rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
              />
              <span className="text-gray-700 font-medium">Coupon attivo</span>
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsAddingCoupon(false);
                setEditingCoupon(null);
                resetNewCoupon();
                setError('');
              }}
              className="flex-1 btn-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              Annulla
            </button>
            <button
              onClick={isAddingCoupon ? handleAddCoupon : handleUpdateCoupon}
              className="flex-1 btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="relative z-10">{isAddingCoupon ? 'Crea Coupon' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-brand-burgundy/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Tag className="w-6 h-6 text-brand-burgundy" />
            </div>
            <p className="text-gray-600">Caricamento coupon...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun coupon trovato</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Nessun coupon corrisponde alla ricerca' : 'Non hai ancora creato coupon'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddingCoupon(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="relative z-10">Crea Primo Coupon</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Codice</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sconto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Utilizzi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Validità</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 font-mono">{coupon.code}</div>
                        {coupon.description && (
                          <div className="text-sm text-gray-600">{coupon.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="w-4 h-4 text-green-500" />
                        ) : (
                          <Euro className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="font-semibold text-brand-burgundy">
                          {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : '€'}
                        </span>
                      </div>
                      {coupon.min_amount > 0 && (
                        <div className="text-xs text-gray-500">Min: €{coupon.min_amount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {coupon.used_count || 0}
                          {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-600">
                          Dal {new Date(coupon.valid_from).toLocaleDateString('it-IT')}
                        </div>
                        {coupon.valid_until && (
                          <div className={`${isExpired(coupon) ? 'text-red-600' : 'text-gray-600'}`}>
                            Al {new Date(coupon.valid_until).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        !coupon.is_active
                          ? 'bg-gray-100 text-gray-800'
                          : isExpired(coupon)
                          ? 'bg-red-100 text-red-800'
                          : isMaxUsesReached(coupon)
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {!coupon.is_active 
                          ? 'Disattivo'
                          : isExpired(coupon)
                          ? 'Scaduto'
                          : isMaxUsesReached(coupon)
                          ? 'Esaurito'
                          : 'Attivo'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCoupon(coupon)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-brand-burgundy mb-2">
            {coupons.length}
          </div>
          <div className="text-sm text-gray-600">Coupon Totali</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {coupons.filter(c => c.is_active && !isExpired(c) && !isMaxUsesReached(c)).length}
          </div>
          <div className="text-sm text-gray-600">Coupon Attivi</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {coupons.reduce((total, c) => total + (c.used_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Utilizzi Totali</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">
            {coupons.filter(c => isExpired(c)).length}
          </div>
          <div className="text-sm text-gray-600">Coupon Scaduti</div>
        </div>
      </div>
    </div>
  );
};

export default CouponManager;