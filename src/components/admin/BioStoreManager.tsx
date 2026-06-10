import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Plus, Edit, Trash2, Eye, EyeOff, Download, ExternalLink, Save } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  woocommerce_id: string;
  woocommerce_url: string;
  is_active: boolean;
  metadata: any;
}

interface StoreSettings {
  id: string;
  coupon_code: string;
  coupon_discount: number;
  woocommerce_base_url: string;
}

const BioStoreManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [woocommerceBaseUrl, setWoocommerceBaseUrl] = useState('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSettings();
  }, []);

  const insertSampleProducts = async () => {
    const sampleProducts = [
      {
        name: 'Olio Extra Vergine di Oliva Bio 500ml',
        description: 'Olio di oliva biologico certificato, prima spremitura a freddo. Proveniente da oliveti toscani, ideale per condire insalate e piatti mediterranei.',
        price: 15.90,
        image_url: 'https://images.pexels.com/photos/33355/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400',
        category: 'Alimentari',
        stock: 45,
        woocommerce_id: 'olio-bio-500',
        woocommerce_url: 'https://loro-sito.com/prodotto/olio-bio',
        is_active: true
      },
      {
        name: 'Pasta Integrale Bio 500g',
        description: 'Pasta di grano duro integrale biologico. Ricca di fibre, prodotta artigianalmente secondo tradizione italiana.',
        price: 3.50,
        image_url: 'https://images.pexels.com/photos/1907244/pexels-photo-1907244.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Alimentari',
        stock: 120,
        woocommerce_id: 'pasta-integrale-500',
        woocommerce_url: 'https://loro-sito.com/prodotto/pasta-integrale',
        is_active: true
      },
      {
        name: 'Miele di Acacia Bio 250g',
        description: 'Miele biologico italiano di acacia. Gusto delicato e dolce, ideale per dolcificare bevande e yogurt.',
        price: 12.90,
        image_url: 'https://images.pexels.com/photos/33162/honey-sweet-syrup-organic.jpg?auto=compress&cs=tinysrgb&w=400',
        category: 'Alimentari',
        stock: 60,
        woocommerce_id: 'miele-acacia-250',
        woocommerce_url: 'https://loro-sito.com/prodotto/miele-acacia',
        is_active: true
      },
      {
        name: 'Crema Viso Naturale 50ml',
        description: 'Crema viso idratante con ingredienti naturali biologici. Adatta a tutti i tipi di pelle, arricchita con aloe vera e olio di jojoba.',
        price: 24.90,
        image_url: 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Cosmesi',
        stock: 30,
        woocommerce_id: 'crema-viso-naturale',
        woocommerce_url: 'https://loro-sito.com/prodotto/crema-viso',
        is_active: true
      },
      {
        name: 'Shampoo Solido Bio',
        description: 'Shampoo solido naturale, zero waste. Formulato con oli essenziali e burro di karité. Equivalente a 3 flaconi di shampoo liquido.',
        price: 14.50,
        image_url: 'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Cosmesi',
        stock: 50,
        woocommerce_id: 'shampoo-solido',
        woocommerce_url: 'https://loro-sito.com/prodotto/shampoo-solido',
        is_active: true
      },
      {
        name: 'Tisana Relax Bio 20 Filtri',
        description: 'Tisana rilassante con camomilla, melissa e lavanda biologiche. Perfetta per la sera, favorisce il sonno naturale.',
        price: 8.90,
        image_url: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Fitoterapici',
        stock: 80,
        woocommerce_id: 'tisana-relax',
        woocommerce_url: 'https://loro-sito.com/prodotto/tisana-relax',
        is_active: true
      },
      {
        name: 'Detersivo Piatti Ecologico 500ml',
        description: 'Detersivo per piatti ecologico, biodegradabile al 100%. Efficace contro il grasso, delicato sulle mani.',
        price: 6.50,
        image_url: 'https://images.pexels.com/photos/4207707/pexels-photo-4207707.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Casa',
        stock: 70,
        woocommerce_id: 'detersivo-piatti-eco',
        woocommerce_url: 'https://loro-sito.com/prodotto/detersivo-piatti',
        is_active: true
      },
      {
        name: 'Spirulina Bio 120 Compresse',
        description: 'Spirulina biologica certificata. Ricca di proteine, vitamine e minerali. Energia naturale per sportivi e vegani.',
        price: 19.90,
        image_url: 'https://images.pexels.com/photos/4955257/pexels-photo-4955257.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Alimentari',
        stock: 40,
        woocommerce_id: 'spirulina-120',
        woocommerce_url: 'https://loro-sito.com/prodotto/spirulina',
        is_active: true
      }
    ];

    const { error } = await supabase
      .from('bio_products')
      .insert(sampleProducts);

    if (error) {
      console.error('Error inserting sample products:', error);
      alert('Errore durante l\'inserimento dei prodotti di esempio');
    } else {
      alert('Prodotti di esempio inseriti con successo!');
      loadProducts();
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('bio_store_settings')
      .select('*')
      .single();

    if (data) {
      setStoreSettings(data);
      setWoocommerceBaseUrl(data.woocommerce_base_url);
    }
  };

  const saveSettings = async (settings: Partial<StoreSettings>) => {
    if (!storeSettings?.id) return;

    const { error } = await supabase
      .from('bio_store_settings')
      .update(settings)
      .eq('id', storeSettings.id);

    if (error) {
      console.error('Error saving settings:', error);
      alert('Errore durante il salvataggio delle impostazioni');
    } else {
      alert('Impostazioni salvate con successo!');
      loadSettings();
      setShowSettings(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bio_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        const product: any = {};

        headers.forEach((header, index) => {
          product[header] = values[index];
        });

        products.push({
          name: product.name || product.Name || '',
          description: product.description || product.Description || '',
          price: parseFloat(product.price || product.Price || '0'),
          image_url: product.image_url || product.ImageURL || '',
          category: product.category || product.Category || '',
          stock: parseInt(product.stock || product.Stock || '0'),
          woocommerce_id: product.woocommerce_id || product.WooCommerceID || '',
          woocommerce_url: product.woocommerce_url || product.WooCommerceURL || '',
          is_active: true,
          metadata: product
        });
      }

      const { error } = await supabase
        .from('bio_products')
        .insert(products);

      if (error) {
        console.error('Error importing products:', error);
        alert('Errore durante l\'importazione dei prodotti');
      } else {
        alert(`${products.length} prodotti importati con successo!`);
        loadProducts();
      }
    };

    reader.readAsText(file);
  };

  const handleSaveProduct = async (product: Partial<Product>) => {
    if (editingProduct?.id) {
      const { error } = await supabase
        .from('bio_products')
        .update(product)
        .eq('id', editingProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        alert('Errore durante l\'aggiornamento');
      } else {
        alert('Prodotto aggiornato!');
        setEditingProduct(null);
        loadProducts();
      }
    } else {
      const { error } = await supabase
        .from('bio_products')
        .insert([product]);

      if (error) {
        console.error('Error creating product:', error);
        alert('Errore durante la creazione');
      } else {
        alert('Prodotto creato!');
        setShowAddForm(false);
        loadProducts();
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    const { error } = await supabase
      .from('bio_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      alert('Errore durante l\'eliminazione');
    } else {
      alert('Prodotto eliminato!');
      loadProducts();
    }
  };

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bio_products')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error toggling product:', error);
    } else {
      loadProducts();
    }
  };

  const exportTemplate = () => {
    const csvContent = 'name,description,price,image_url,category,stock,woocommerce_id,woocommerce_url\n' +
      'Olio Extra Vergine Bio,Olio biologico toscano,15.99,https://example.com/image.jpg,Condimenti,50,123,https://shop.example.com/product/olio-bio';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_prodotti_bio.csv';
    a.click();
  };

  const ProductForm = ({ product, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState(product || {
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: '',
      stock: 0,
      woocommerce_id: '',
      woocommerce_url: '',
      is_active: true
    });

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">
          {product?.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Prodotto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prezzo (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giacenza</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL Immagine</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID WooCommerce</label>
            <input
              type="text"
              value={formData.woocommerce_id}
              onChange={(e) => setFormData({ ...formData, woocommerce_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">URL WooCommerce (link diretto al prodotto)</label>
            <input
              type="text"
              value={formData.woocommerce_url}
              onChange={(e) => setFormData({ ...formData, woocommerce_url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="https://loro-sito.com/prodotto/nome-prodotto"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave(formData)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Salva
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Annulla
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Gestione Shop Online</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Save className="w-4 h-4" />
          Impostazioni Coupon
        </button>
      </div>

      {showSettings && storeSettings && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Impostazioni Coupon & Tracking</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configura il coupon code che verrà automaticamente applicato quando gli utenti acquistano dallo Shop Online.
            Questo ti permette di tracciare esattamente quante vendite provengono dal tuo sito.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Codice Coupon</label>
              <input
                type="text"
                value={storeSettings.coupon_code}
                onChange={(e) => setStoreSettings({ ...storeSettings, coupon_code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="VILMA10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Questo codice verrà applicato automaticamente al checkout WooCommerce
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sconto Coupon (%)</label>
              <input
                type="number"
                value={storeSettings.coupon_discount}
                onChange={(e) => setStoreSettings({ ...storeSettings, coupon_discount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo per visualizzazione sul tuo sito (lo sconto reale va configurato su WooCommerce)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">URL Base WooCommerce</label>
              <input
                type="text"
                value={storeSettings.woocommerce_base_url}
                onChange={(e) => setStoreSettings({ ...storeSettings, woocommerce_base_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://loro-sito.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL base del sito WooCommerce (senza slash finale)
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">Come funziona il tracking:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Ogni click su "Acquista Ora" viene registrato nel database</li>
              <li>✓ Ogni checkout iniziato viene tracciato con i prodotti selezionati</li>
              <li>✓ Il coupon <strong>{storeSettings.coupon_code}</strong> viene applicato automaticamente</li>
              <li>✓ Puoi vedere statistiche dettagliate nella sezione "Analytics Shop Online"</li>
              <li>✓ Su WooCommerce vedrai tutti gli ordini che usano il coupon {storeSettings.coupon_code}</li>
            </ul>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => saveSettings({
                coupon_code: storeSettings.coupon_code,
                coupon_discount: storeSettings.coupon_discount,
                woocommerce_base_url: storeSettings.woocommerce_base_url
              })}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Salva Impostazioni
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                loadSettings();
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {products.length === 0 && (
            <button
              onClick={insertSampleProducts}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Inserisci Prodotti Demo
            </button>
          )}
          <button
            onClick={exportTemplate}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Scarica Template CSV
          </button>
          <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            Importa CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Nuovo Prodotto
          </button>
        </div>
      </div>

      {showAddForm && (
        <ProductForm
          onSave={(data: any) => handleSaveProduct(data)}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={(data: any) => handleSaveProduct(data)}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Caricamento prodotti...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow p-4 ${!product.is_active ? 'opacity-50' : ''}`}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}

              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              <p className="text-green-600 font-bold text-xl mb-2">€{product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mb-2">Giacenza: {product.stock}</p>

              {product.woocommerce_url && (
                <a
                  href={product.woocommerce_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline mb-3"
                >
                  <ExternalLink className="w-3 h-3" />
                  Vedi su WooCommerce
                </a>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  <Edit className="w-3 h-3" />
                  Modifica
                </button>
                <button
                  onClick={() => toggleProductActive(product.id, product.is_active)}
                  className="flex items-center justify-center gap-1 bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
                >
                  {product.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Nessun prodotto presente</p>
          <p className="text-sm text-gray-500">
            Carica un CSV o aggiungi prodotti manualmente per iniziare
          </p>
        </div>
      )}
    </div>
  );
};

export default BioStoreManager;
