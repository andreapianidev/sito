import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Content {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  content_type: string;
  price: number;
  original_price: number;
  cover_image_url: string;
  file_url?: string;
  preview_url?: string;
  features: string[];
  tags: string[];
  required_subscription_type: string | null;
  is_free: boolean;
  is_published: boolean;
}

export default function ContentManager() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Partial<Content> | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setContents(data);
    } catch (error) {
      console.error('Error loading contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingContent) return;

    try {
      if (editingContent.id) {
        const { error } = await supabase
          .from('educational_content')
          .update(editingContent)
          .eq('id', editingContent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('educational_content')
          .insert([editingContent]);

        if (error) throw error;
      }

      await loadContents();
      setShowForm(false);
      setEditingContent(null);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Errore durante il salvataggio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo contenuto?')) return;

    try {
      const { error } = await supabase
        .from('educational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'book': 'Libro',
      'guide': 'Guida',
      'video_course': 'Video Corso',
      'recipe_book': 'Ricettario',
      'worksheet': 'Scheda'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Contenuti Educativi</h2>
        <button
          onClick={() => {
            setEditingContent({
              title: '',
              subtitle: '',
              description: '',
              content_type: 'guide',
              price: 0,
              original_price: 0,
              cover_image_url: '',
              features: [],
              tags: [],
              required_subscription_type: null,
              is_free: false,
              is_published: true
            });
            setShowForm(true);
          }}
          className="bg-brand-burgundy text-white px-4 py-2 rounded-lg hover:bg-brand-burgundy-dark flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuovo Contenuto
        </button>
      </div>

      <div className="grid gap-4">
        {contents.map((content) => (
          <div key={content.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start gap-4">
              <img
                src={content.cover_image_url}
                alt={content.title}
                className="w-24 h-32 object-cover rounded"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{content.title}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {getTypeLabel(content.content_type)}
                      </span>
                      {!content.is_published && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                          Bozza
                        </span>
                      )}
                      {content.is_free && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Gratuito
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{content.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingContent(content);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-brand-burgundy">€{content.price}</span>
                  {content.original_price > content.price && (
                    <span className="line-through text-gray-400">€{content.original_price}</span>
                  )}
                  {content.required_subscription_type && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      Piano: {content.required_subscription_type}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-2">{content.description}</p>

                {content.features && content.features.length > 0 && (
                  <div className="text-xs text-gray-600">
                    {content.features.length} feature incluse
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && editingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingContent.id ? 'Modifica Contenuto' : 'Nuovo Contenuto'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={editingContent.title || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo</label>
                <input
                  type="text"
                  value={editingContent.subtitle || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={editingContent.description || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editingContent.content_type || 'guide'}
                    onChange={(e) => setEditingContent({ ...editingContent, content_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  >
                    <option value="book">Libro</option>
                    <option value="guide">Guida</option>
                    <option value="video_course">Video Corso</option>
                    <option value="recipe_book">Ricettario</option>
                    <option value="worksheet">Scheda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Piano Richiesto</label>
                  <select
                    value={editingContent.required_subscription_type || ''}
                    onChange={(e) => setEditingContent({ ...editingContent, required_subscription_type: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  >
                    <option value="">Nessuno (solo acquisto)</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="complete">Complete</option>
                    <option value="pt">PT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingContent.price || 0}
                    onChange={(e) => setEditingContent({ ...editingContent, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo Originale (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingContent.original_price || 0}
                    onChange={(e) => setEditingContent({ ...editingContent, original_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Immagine Copertina</label>
                <input
                  type="text"
                  value={editingContent.cover_image_url || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, cover_image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL File Download</label>
                <input
                  type="text"
                  value={editingContent.file_url || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, file_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-burgundy focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingContent.is_free || false}
                    onChange={(e) => setEditingContent({ ...editingContent, is_free: e.target.checked })}
                    className="w-4 h-4 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
                  />
                  <span className="text-sm font-medium text-gray-700">Gratuito</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingContent.is_published || false}
                    onChange={(e) => setEditingContent({ ...editingContent, is_published: e.target.checked })}
                    className="w-4 h-4 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
                  />
                  <span className="text-sm font-medium text-gray-700">Pubblicato</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-brand-burgundy text-white py-2 rounded-lg hover:bg-brand-burgundy-dark flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salva
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
