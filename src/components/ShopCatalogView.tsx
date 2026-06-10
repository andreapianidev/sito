import React, { useState, useEffect } from 'react';
import { Package, Sparkles, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  role: string;
  focus_areas: string[];
  image_url: string | null;
  stock: number;
}

interface ShopCatalogViewProps {
  onStartGuidedShop: () => void;
}

const ShopCatalogView: React.FC<ShopCatalogViewProps> = ({ onStartGuidedShop }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const focusCategories = [
    { value: null, label: 'Tutti i prodotti' },
    { value: 'pancia', label: 'Benessere Digestivo' },
    { value: 'drenaggio', label: 'Drenaggio' },
    { value: 'energia', label: 'Energia' },
    { value: 'stress', label: 'Stress e Relax' },
    { value: 'sonno', label: 'Sonno' }
  ];

  const filteredProducts = selectedFocus
    ? products.filter(p => p.focus_areas.includes(selectedFocus))
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <p className="font-semibold">
                  Vuoi una selezione personalizzata e non sbagliare acquisto?
                </p>
                <p className="text-sm text-emerald-100">
                  Ti guiderò passo passo nella scelta perfetta per te
                </p>
              </div>
            </div>
            <button
              onClick={onStartGuidedShop}
              className="bg-white text-rose-600 hover:bg-rose-50 font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-lg hover:shadow-xl"
            >
              Avvia percorso guidato
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Catalogo Prodotti
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Esplora la nostra selezione di prodotti naturali per il tuo benessere
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {focusCategories.map((category) => (
            <button
              key={category.value || 'all'}
              onClick={() => setSelectedFocus(category.value)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedFocus === category.value
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Nessun prodotto trovato per questa categoria
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-8">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-rose-600 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.focus_areas.slice(0, 2).map((focus) => (
                      <span
                        key={focus}
                        className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-2xl font-bold text-rose-600">
                        {product.price.toFixed(2)}€
                      </p>
                      {product.stock < 10 && product.stock > 0 && (
                        <p className="text-xs text-orange-600 font-medium mt-1">
                          Solo {product.stock} disponibili
                        </p>
                      )}
                    </div>
                    <button
                      disabled={product.stock === 0}
                      className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
                      title="Aggiungi al carrello"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Non sai da dove iniziare?
          </h2>
          <p className="text-xl text-rose-100 mb-6 max-w-2xl mx-auto">
            Lascia che ti aiuti a trovare la combinazione perfetta di prodotti per le tue esigenze
          </p>
          <button
            onClick={onStartGuidedShop}
            className="bg-white text-rose-600 hover:bg-rose-50 font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl text-lg"
          >
            Scopri la tua routine personalizzata
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopCatalogView;
