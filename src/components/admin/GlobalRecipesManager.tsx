import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChefHat, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Clock, Zap } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  preparation_time: number;
  cooking_time: number;
  servings: number;
  difficulty: string;
  season: string[];
  ingredients: any[];
  instructions: string[];
  nutritional_info: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  dietary_tags: string[];
  allergens: string[];
  is_active: boolean;
  tips?: string;
  variations?: string;
  created_at: string;
}

const GlobalRecipesManager: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeason, setFilterSeason] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    category: 'breakfast',
    preparation_time: 10,
    cooking_time: 10,
    servings: 1,
    difficulty: 'easy',
    season: [],
    ingredients: [],
    instructions: [],
    nutritional_info: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
    },
    dietary_tags: [],
    allergens: [],
    is_active: true,
  });

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recipes, filterCategory, filterSeason, searchTerm]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .is('created_by', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }

    if (filterSeason !== 'all') {
      filtered = filtered.filter(r => r.season && r.season.includes(filterSeason));
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleSave = async () => {
    try {
      if (editingRecipe) {
        const { error } = await supabase
          .from('recipes')
          .update(formData)
          .eq('id', editingRecipe.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipes')
          .insert([{ ...formData, created_by: null }]);

        if (error) throw error;
      }

      await loadRecipes();
      closeModal();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Errore nel salvare la ricetta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa ricetta?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Errore nell\'eliminare la ricetta');
    }
  };

  const toggleActive = async (recipe: Recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_active: !recipe.is_active })
        .eq('id', recipe.id);

      if (error) throw error;
      await loadRecipes();
    } catch (error) {
      console.error('Error toggling recipe:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      category: 'breakfast',
      preparation_time: 10,
      cooking_time: 10,
      servings: 1,
      difficulty: 'easy',
      season: [],
      ingredients: [],
      instructions: [],
      nutritional_info: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
      },
      dietary_tags: [],
      allergens: [],
      is_active: true,
    });
    setEditingRecipe(null);
    setShowCreateModal(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setFormData(recipe);
    setEditingRecipe(recipe);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingRecipe(null);
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: '', quantity: 0, unit: 'g' }]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || []
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ) || []
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index) || []
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.map((inst, i) =>
        i === index ? value : inst
      ) || []
    }));
  };

  const toggleSeasonTag = (season: string) => {
    setFormData(prev => {
      const seasons = prev.season || [];
      if (seasons.includes(season)) {
        return { ...prev, season: seasons.filter(s => s !== season) };
      } else {
        return { ...prev, season: [...seasons, season] };
      }
    });
  };

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => {
      const tags = prev.dietary_tags || [];
      if (tags.includes(tag)) {
        return { ...prev, dietary_tags: tags.filter(t => t !== tag) };
      } else {
        return { ...prev, dietary_tags: [...tags, tag] };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-burgundy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ricettario Globale</h2>
          <p className="text-gray-600">Gestisci le ricette disponibili per tutti gli utenti</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-brand-burgundy/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuova Ricetta</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Ricette Globali vs Personalizzate</h3>
        <p className="text-sm text-blue-700">
          Le ricette globali (created_by = NULL) sono visibili a tutti gli utenti e vengono usate per comporre i menù settimanali personalizzati.
          Il sistema filtra automaticamente le ricette in base alle allergie e preferenze dietetiche di ogni utente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Totale Ricette</p>
          <p className="text-2xl font-bold text-gray-900">{recipes.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Attive</p>
          <p className="text-2xl font-bold text-green-600">{recipes.filter(r => r.is_active).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Inattive</p>
          <p className="text-2xl font-bold text-gray-400">{recipes.filter(r => !r.is_active).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Filtrate</p>
          <p className="text-2xl font-bold text-brand-burgundy">{filteredRecipes.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cerca</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca ricetta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            >
              <option value="all">Tutte</option>
              <option value="breakfast">Colazione</option>
              <option value="lunch">Pranzo</option>
              <option value="dinner">Cena</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stagione</label>
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
            >
              <option value="all">Tutte</option>
              <option value="spring">Primavera</option>
              <option value="summer">Estate</option>
              <option value="autumn">Autunno</option>
              <option value="winter">Inverno</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className={`bg-white rounded-lg border-2 ${recipe.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'} overflow-hidden`}>
            <div className={`h-32 flex items-center justify-center ${
              recipe.category === 'breakfast' ? 'bg-orange-100' :
              recipe.category === 'lunch' ? 'bg-blue-100' :
              recipe.category === 'dinner' ? 'bg-purple-100' :
              'bg-pink-100'
            }`}>
              <ChefHat className={`w-12 h-12 ${
                recipe.category === 'breakfast' ? 'text-orange-600' :
                recipe.category === 'lunch' ? 'text-blue-600' :
                recipe.category === 'dinner' ? 'text-purple-600' :
                'text-pink-600'
              }`} />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{recipe.title}</h3>
                <button
                  onClick={() => toggleActive(recipe)}
                  className={`p-1 rounded ${recipe.is_active ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {recipe.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {recipe.preparation_time + recipe.cooking_time} min
                </span>
                <span className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  {recipe.nutritional_info.calories} kcal
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(recipe)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRecipe ? 'Modifica Ricetta' : 'Nuova Ricetta Globale'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="breakfast">Colazione</option>
                    <option value="lunch">Pranzo</option>
                    <option value="dinner">Cena</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficoltà</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Media</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Preparazione (min)</label>
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Cottura (min)</label>
                  <input
                    type="number"
                    value={formData.cooking_time}
                    onChange={(e) => setFormData({ ...formData, cooking_time: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stagioni</label>
                  <div className="flex space-x-2">
                    {['spring', 'summer', 'autumn', 'winter'].map(season => (
                      <button
                        key={season}
                        type="button"
                        onClick={() => toggleSeasonTag(season)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          formData.season?.includes(season)
                            ? 'bg-brand-burgundy text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {season === 'spring' ? 'Primavera' :
                         season === 'summer' ? 'Estate' :
                         season === 'autumn' ? 'Autunno' : 'Inverno'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tag Dietetici</label>
                  <div className="flex flex-wrap gap-2">
                    {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'low_carb'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietaryTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          formData.dietary_tags?.includes(tag)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tag === 'vegetarian' ? 'Vegetariano' :
                         tag === 'vegan' ? 'Vegano' :
                         tag === 'gluten_free' ? 'Senza Glutine' :
                         tag === 'dairy_free' ? 'Senza Lattosio' : 'Low Carb'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredienti</label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-sm text-brand-burgundy hover:text-brand-burgundy/80"
                  >
                    + Aggiungi
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients?.map((ing, idx) => (
                    <div key={idx} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Qtà"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Unità"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Istruzioni</label>
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="text-sm text-brand-burgundy hover:text-brand-burgundy/80"
                  >
                    + Aggiungi Passo
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.instructions?.map((inst, idx) => (
                    <div key={idx} className="flex space-x-2">
                      <span className="px-3 py-2 bg-gray-100 rounded-lg font-medium">{idx + 1}</span>
                      <input
                        type="text"
                        value={inst}
                        onChange={(e) => updateInstruction(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valori Nutrizionali</label>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Calorie</label>
                    <input
                      type="number"
                      value={formData.nutritional_info?.calories}
                      onChange={(e) => setFormData({
                        ...formData,
                        nutritional_info: { ...formData.nutritional_info!, calories: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Proteine (g)</label>
                    <input
                      type="number"
                      value={formData.nutritional_info?.protein}
                      onChange={(e) => setFormData({
                        ...formData,
                        nutritional_info: { ...formData.nutritional_info!, protein: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Carboidrati (g)</label>
                    <input
                      type="number"
                      value={formData.nutritional_info?.carbs}
                      onChange={(e) => setFormData({
                        ...formData,
                        nutritional_info: { ...formData.nutritional_info!, carbs: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Grassi (g)</label>
                    <input
                      type="number"
                      value={formData.nutritional_info?.fats}
                      onChange={(e) => setFormData({
                        ...formData,
                        nutritional_info: { ...formData.nutritional_info!, fats: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fibre (g)</label>
                    <input
                      type="number"
                      value={formData.nutritional_info?.fiber}
                      onChange={(e) => setFormData({
                        ...formData,
                        nutritional_info: { ...formData.nutritional_info!, fiber: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-burgundy text-white rounded-lg hover:bg-brand-burgundy/90 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Salva Ricetta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRecipesManager;
