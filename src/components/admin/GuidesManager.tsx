import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, BookOpen, Upload, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Guide {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  content_type: string;
  price: number;
  original_price?: number;
  cover_image_url?: string;
  file_url?: string;
  preview_url?: string;
  is_published: boolean;
  tags: string[];
  author: string;
  page_count?: number;
  features?: string[];
  required_subscription_type?: string;
  is_free: boolean;
}

const GuidesManager: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddingGuide, setIsAddingGuide] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [error, setError] = useState('');

  const [newGuide, setNewGuide] = useState<Guide>({
    title: '',
    subtitle: '',
    description: '',
    content_type: 'guide',
    price: 0,
    original_price: 0,
    cover_image_url: '',
    file_url: '',
    preview_url: '',
    is_published: false,
    is_free: false,
    tags: [],
    author: 'Dr.ssa Vilma Nardini',
    page_count: 0,
    features: [],
    required_subscription_type: null,
  });

  const contentTypes = [
    'book',
    'guide',
    'video_course',
    'worksheet',
    'recipe_book'
  ];

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGuides(data || []);
    } catch (error) {
      console.error('Error loading guides:', error);
      setError('Errore nel caricamento delle guide');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuide = async () => {
    try {
      setError('');

      // Validation
      if (!newGuide.title || !newGuide.content_type || newGuide.price === undefined) {
        setError('Titolo, tipo e prezzo sono obbligatori');
        return;
      }

      const { data, error } = await supabase
        .from('educational_content')
        .insert([newGuide])
        .select()
        .single();

      if (error) throw error;

      await loadGuides();
      setIsAddingGuide(false);
      resetNewGuide();

    } catch (error: any) {
      console.error('Error adding guide:', error);
      setError(error.message || 'Errore nella creazione della guida');
    }
  };

  const handleUpdateGuide = async () => {
    try {
      setError('');
      console.log('🔄 Updating guide...', editingGuide);

      if (!editingGuide || !editingGuide.id) {
        console.error('❌ No guide to update or missing ID');
        setError('ID guida mancante');
        return;
      }

      const { id, created_at, updated_at, rating, review_count, ...updateData } = editingGuide as any;

      console.log('📤 Sending update data:', updateData);
      console.log('🎯 Guide ID:', id);

      console.log('⏳ Starting Supabase update call...');
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('educational_content')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      const endTime = Date.now();
      console.log(`⏱️ Update completato in ${endTime - startTime}ms`);

      console.log('📦 Data:', data);
      console.log('📦 Error:', error);

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Errore database: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);
        alert('❌ ERRORE: ' + error.message);
        return;
      }

      console.log('✅ Guide updated successfully:', data);
      console.log('🎉 About to show success alert');
      alert('✅ Guida aggiornata con successo!');
      console.log('🔄 Reloading guides...');
      await loadGuides();
      console.log('🚪 Closing modal...');
      setEditingGuide(null);
      console.log('✨ All done!');

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      setError(error.message || 'Errore nell\'aggiornamento della guida');
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa guida?')) return;

    try {
      const { error } = await supabase
        .from('educational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadGuides();
    } catch (error: any) {
      console.error('Error deleting guide:', error);
      setError(error.message || 'Errore nell\'eliminazione della guida');
    }
  };

  const resetNewGuide = () => {
    setNewGuide({
      title: '',
      subtitle: '',
      description: '',
      content_type: 'guide',
      price: 0,
      original_price: 0,
      cover_image_url: '',
      file_url: '',
      preview_url: '',
      is_published: false,
      is_free: false,
      tags: [],
      author: 'Dr.ssa Vilma Nardini',
      page_count: 0,
      features: [],
      required_subscription_type: null,
    });
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = !searchTerm ||
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || guide.content_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guide & Libri Digitali</h2>
          <p className="text-gray-600">Gestisci il catalogo delle tue pubblicazioni digitali</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca guide..."
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
            <option value="">Tutti i tipi</option>
            {contentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            onClick={() => setIsAddingGuide(true)}
            className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuova Guida</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Add/Edit Guide Form */}
      {(isAddingGuide || editingGuide) && (
        <div className="bg-white rounded-2xl p-6 shadow-soft border-2 border-brand-burgundy/20">
          <h3 className="text-xl font-semibold mb-6">
            {isAddingGuide ? 'Crea Nuova Guida' : 'Modifica Guida'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titolo *</label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.title : editingGuide?.title || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, title: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, title: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="Titolo della guida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sottotitolo</label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.subtitle : editingGuide?.subtitle || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, subtitle: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, subtitle: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="Sottotitolo descrittivo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione *</label>
              <textarea
                value={isAddingGuide ? newGuide.description : editingGuide?.description || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, description: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, description: e.target.value});
                  }
                }}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent resize-none"
                placeholder="Descrizione dettagliata della guida..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Contenuto *</label>
              <select
                value={isAddingGuide ? newGuide.content_type : editingGuide?.content_type || 'guide'}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, content_type: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, content_type: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
              >
                {contentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Autore</label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.author : editingGuide?.author || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, author: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, author: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="Nome autore"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo *</label>
              <div className="relative">
                <input
                  type="number"
                  value={isAddingGuide ? newGuide.price : editingGuide?.price || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (isAddingGuide) {
                      setNewGuide({...newGuide, price: value});
                    } else if (editingGuide) {
                      setEditingGuide({...editingGuide, price: value});
                    }
                  }}
                  className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo Originale</label>
              <div className="relative">
                <input
                  type="number"
                  value={isAddingGuide ? newGuide.original_price : editingGuide?.original_price || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (isAddingGuide) {
                      setNewGuide({...newGuide, original_price: value});
                    } else if (editingGuide) {
                      setEditingGuide({...editingGuide, original_price: value});
                    }
                  }}
                  className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numero Pagine</label>
              <input
                type="number"
                value={isAddingGuide ? newGuide.page_count : editingGuide?.page_count || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, page_count: value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, page_count: value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gratuito</label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isAddingGuide ? newGuide.is_free : editingGuide?.is_free || false}
                  onChange={(e) => {
                    if (isAddingGuide) {
                      setNewGuide({...newGuide, is_free: e.target.checked});
                    } else if (editingGuide) {
                      setEditingGuide({...editingGuide, is_free: e.target.checked});
                    }
                  }}
                  className="rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
                />
                <span className="text-gray-700">Contenuto gratuito</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Copertina
                <span className="text-xs text-gray-500 ml-2">(carica su Storage e incolla link)</span>
              </label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.cover_image_url : editingGuide?.cover_image_url || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, cover_image_url: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, cover_image_url: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="https://...supabase.co/storage/v1/object/public/guide-covers/..."
              />
              {(isAddingGuide ? newGuide.cover_image_url : editingGuide?.cover_image_url) && (
                <img
                  src={isAddingGuide ? newGuide.cover_image_url : editingGuide?.cover_image_url}
                  alt="Anteprima copertina"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL File Guida (PDF)
                <span className="text-xs text-gray-500 ml-2">(carica su Storage e incolla link)</span>
              </label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.file_url : editingGuide?.file_url || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, file_url: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, file_url: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="https://...supabase.co/storage/v1/object/public/guide-files/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL File Anteprima (opzionale)
                <span className="text-xs text-gray-500 ml-2">(carica su Storage e incolla link)</span>
              </label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.preview_url : editingGuide?.preview_url || ''}
                onChange={(e) => {
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, preview_url: e.target.value});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, preview_url: e.target.value});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="https://...supabase.co/storage/v1/object/public/guide-files/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (separati da virgola)</label>
              <input
                type="text"
                value={isAddingGuide ? newGuide.tags.join(', ') : editingGuide?.tags.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  if (isAddingGuide) {
                    setNewGuide({...newGuide, tags});
                  } else if (editingGuide) {
                    setEditingGuide({...editingGuide, tags});
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                placeholder="nutrizione, salute, benessere"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isAddingGuide ? newGuide.is_published : editingGuide?.is_published || false}
                  onChange={(e) => {
                    if (isAddingGuide) {
                      setNewGuide({...newGuide, is_published: e.target.checked});
                    } else if (editingGuide) {
                      setEditingGuide({...editingGuide, is_published: e.target.checked});
                    }
                  }}
                  className="rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
                />
                <span className="text-gray-700 font-medium">Pubblica immediatamente</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsAddingGuide(false);
                setEditingGuide(null);
                resetNewGuide();
                setError('');
              }}
              className="flex-1 btn-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              Annulla
            </button>
            <button
              onClick={isAddingGuide ? handleAddGuide : handleUpdateGuide}
              className="flex-1 btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="relative z-10">{isAddingGuide ? 'Crea Guida' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Guides Grid */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-brand-burgundy/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <BookOpen className="w-6 h-6 text-brand-burgundy" />
            </div>
            <p className="text-gray-600">Caricamento guide...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessuna guida trovata</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Nessuna guida corrisponde alla ricerca' : 'Non hai ancora creato guide'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddingGuide(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="relative z-10">Crea Prima Guida</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredGuides.map((guide) => (
              <div key={guide.id} className="bg-gray-50 rounded-2xl p-6 hover:shadow-medium transition-all duration-300">
                <div className="relative mb-4">
                  {guide.cover_image_url ? (
                    <img
                      src={guide.cover_image_url}
                      alt={guide.title}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-brand-burgundy/20 to-brand-pink/20 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-brand-burgundy/50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      guide.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {guide.is_published ? 'Pubblicato' : 'Bozza'}
                    </span>
                    {guide.original_price && guide.original_price > guide.price && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        -{Math.round(((guide.original_price - guide.price) / guide.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{guide.title}</h3>
                    {guide.subtitle && (
                      <p className="text-sm text-gray-600">{guide.subtitle}</p>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-3">{guide.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-brand-burgundy">€{guide.price}</span>
                        {guide.original_price && guide.original_price > guide.price && (
                          <span className="text-lg text-gray-400 line-through">€{guide.original_price}</span>
                        )}
                      </div>
                      {guide.page_count && (
                        <div className="text-xs text-gray-500">
                          {guide.page_count} pagine
                        </div>
                      )}
                    </div>
                    <span className="text-xs bg-brand-burgundy/10 text-brand-burgundy px-2 py-1 rounded-full">
                      {guide.content_type}
                    </span>
                  </div>

                  {guide.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {guide.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {guide.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{guide.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2 pt-3">
                    <button
                      onClick={() => setEditingGuide(guide)}
                      className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifica</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGuide(guide.id!)}
                      className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Elimina</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-brand-burgundy mb-2">
            {guides.length}
          </div>
          <div className="text-sm text-gray-600">Guide Totali</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {guides.filter(g => g.is_published).length}
          </div>
          <div className="text-sm text-gray-600">Pubblicate</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-2">
            {guides.filter(g => !g.is_published).length}
          </div>
          <div className="text-sm text-gray-600">Bozze</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            €{guides.reduce((total, g) => total + (g.price || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Valore Catalogo</div>
        </div>
      </div>
    </div>
  );
};

export default GuidesManager;