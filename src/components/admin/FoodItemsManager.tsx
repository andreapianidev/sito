import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, Utensils } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FoodItem {
  id?: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g: number;
  unit: string;
}

const FoodItemsManager: React.FC = () => {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);

  const [newFood, setNewFood] = useState<FoodItem>({
    name: '',
    category: '',
    calories_per_100g: 0,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fats_per_100g: 0,
    fiber_per_100g: 0,
    unit: 'g'
  });

  const categories = [
    'Cereali e derivati',
    'Carne e derivati',
    'Pesce e frutti di mare',
    'Latte e derivati',
    'Uova',
    'Legumi',
    'Verdure e ortaggi',
    'Frutta',
    'Frutta secca',
    'Oli e grassi',
    'Dolci',
    'Bevande',
    'Condimenti e spezie'
  ];

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setFoodItems(data || []);
    } catch (error) {
      console.error('Error loading food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    try {
      const { error } = await supabase
        .from('food_items')
        .insert([newFood]);

      if (error) throw error;
      
      setIsAddingFood(false);
      setNewFood({
        name: '',
        category: '',
        calories_per_100g: 0,
        protein_per_100g: 0,
        carbs_per_100g: 0,
        fats_per_100g: 0,
        fiber_per_100g: 0,
        unit: 'g'
      });
      loadFoodItems();
    } catch (error) {
      console.error('Error adding food item:', error);
    }
  };

  const handleUpdateFood = async () => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update(editingFood)
        .eq('id', editingFood.id);

      if (error) throw error;
      
      setEditingFood(null);
      loadFoodItems();
    } catch (error) {
      console.error('Error updating food item:', error);
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo alimento?')) return;

    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadFoodItems();
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  const filteredFoodItems = foodItems.filter(food => {
    const matchesSearch = !searchTerm || 
      food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || food.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Alimenti</h2>
          <p className="text-gray-600">Gestisci il database degli alimenti per i piani nutrizionali</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca alimenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={() => setIsAddingFood(true)}
            className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuovo Alimento</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Food Form */}
      {(isAddingFood || editingFood) && (
        <div className="bg-white rounded-2xl p-6 shadow-soft border-2 border-brand-burgundy/20">
          <h3 className="text-xl font-semibold mb-4">
            {isAddingFood ? 'Aggiungi Nuovo Alimento' : 'Modifica Alimento'}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
              <input
                type="text"
                value={isAddingFood ? newFood.name : editingFood?.name || ''}
                onChange={(e) => {
                  if (isAddingFood) {
                    setNewFood({...newFood, name: e.target.value});
                  } else {
                    setEditingFood({...editingFood, name: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="es. Petto di pollo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
              <select
                value={isAddingFood ? newFood.category : editingFood?.category || ''}
                onChange={(e) => {
                  if (isAddingFood) {
                    setNewFood({...newFood, category: e.target.value});
                  } else {
                    setEditingFood({...editingFood, category: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              >
                <option value="">Seleziona categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unità</label>
              <select
                value={isAddingFood ? newFood.unit : editingFood?.unit || 'g'}
                onChange={(e) => {
                  if (isAddingFood) {
                    setNewFood({...newFood, unit: e.target.value});
                  } else {
                    setEditingFood({...editingFood, unit: e.target.value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              >
                <option value="g">Grammi (g)</option>
                <option value="ml">Millilitri (ml)</option>
                <option value="pz">Pezzo (pz)</option>
                <option value="cucchiaio">Cucchiaio</option>
                <option value="cucchiaino">Cucchiaino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calorie/100g *</label>
              <input
                type="number"
                value={isAddingFood ? newFood.calories_per_100g : editingFood?.calories_per_100g || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (isAddingFood) {
                    setNewFood({...newFood, calories_per_100g: value});
                  } else {
                    setEditingFood({...editingFood, calories_per_100g: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proteine/100g</label>
              <input
                type="number"
                value={isAddingFood ? newFood.protein_per_100g : editingFood?.protein_per_100g || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (isAddingFood) {
                    setNewFood({...newFood, protein_per_100g: value});
                  } else {
                    setEditingFood({...editingFood, protein_per_100g: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Carboidrati/100g</label>
              <input
                type="number"
                value={isAddingFood ? newFood.carbs_per_100g : editingFood?.carbs_per_100g || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (isAddingFood) {
                    setNewFood({...newFood, carbs_per_100g: value});
                  } else {
                    setEditingFood({...editingFood, carbs_per_100g: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grassi/100g</label>
              <input
                type="number"
                value={isAddingFood ? newFood.fats_per_100g : editingFood?.fats_per_100g || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (isAddingFood) {
                    setNewFood({...newFood, fats_per_100g: value});
                  } else {
                    setEditingFood({...editingFood, fats_per_100g: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fibre/100g</label>
              <input
                type="number"
                value={isAddingFood ? newFood.fiber_per_100g : editingFood?.fiber_per_100g || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (isAddingFood) {
                    setNewFood({...newFood, fiber_per_100g: value});
                  } else {
                    setEditingFood({...editingFood, fiber_per_100g: value});
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsAddingFood(false);
                setEditingFood(null);
                setNewFood({
                  name: '',
                  category: '',
                  calories_per_100g: 0,
                  protein_per_100g: 0,
                  carbs_per_100g: 0,
                  fats_per_100g: 0,
                  fiber_per_100g: 0,
                  unit: 'g'
                });
              }}
              className="flex-1 btn-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              Annulla
            </button>
            <button
              onClick={isAddingFood ? handleAddFood : handleUpdateFood}
              className="flex-1 btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="relative z-10">{isAddingFood ? 'Aggiungi' : 'Salva'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Food Items Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-brand-burgundy/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Utensils className="w-6 h-6 text-brand-burgundy" />
            </div>
            <p className="text-gray-600">Caricamento alimenti...</p>
          </div>
        ) : filteredFoodItems.length === 0 ? (
          <div className="p-12 text-center">
            <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun alimento trovato</h3>
            <p className="text-gray-600">Non ci sono alimenti che corrispondono ai filtri selezionati</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Alimento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Calorie/100g</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proteine</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Carboidrati</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Grassi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFoodItems.map((food) => (
                  <tr key={food.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{food.name}</div>
                        <div className="text-sm text-gray-600">Unità: {food.unit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{food.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">{food.calories_per_100g}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-600">{food.protein_per_100g}g</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-orange-600">{food.carbs_per_100g}g</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-purple-600">{food.fats_per_100g}g</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingFood(food)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFood(food.id)}
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
        {categories.slice(0, 4).map((category) => (
          <div key={category} className="bg-white rounded-2xl p-6 shadow-soft text-center">
            <div className="text-2xl font-bold text-brand-burgundy mb-2">
              {foodItems.filter(f => f.category === category).length}
            </div>
            <div className="text-sm text-gray-600">{category}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodItemsManager;
