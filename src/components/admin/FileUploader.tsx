import { useState } from 'react';
import { Upload, X, CheckCircle, Loader, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FileUploaderProps {
  type: 'cover' | 'file';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUploader({
  type,
  currentUrl,
  onUploadComplete,
  accept,
  maxSizeMB = 5
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const bucketName = type === 'cover' ? 'guide-covers' : 'guide-files';
  const defaultAccept = type === 'cover' ? 'image/jpeg,image/png,image/webp' : 'application/pdf';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Il file supera il limite di ${maxSizeMB}MB`);
      return;
    }

    // Show preview for images
    if (type === 'cover' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Check if bucket exists, create if not
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error(`Errore nel controllo dei bucket: ${listError.message}`);
      }

      const bucketExists = buckets?.some(b => b.id === bucketName);

      if (!bucketExists) {
        console.log(`Bucket ${bucketName} non trovato, creazione in corso...`);

        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: type === 'cover' ? 5242880 : 52428800,
          allowedMimeTypes: type === 'cover'
            ? ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
            : ['application/pdf', 'application/zip', 'application/epub+zip']
        });

        if (createError) {
          console.error('Bucket creation error:', createError);
          throw new Error(`Impossibile creare il bucket. Vai sul Dashboard Supabase > Storage e crea manualmente il bucket "${bucketName}"`);
        }

        console.log(`Bucket ${bucketName} creato con successo!`);
      }

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setProgress(100);
      onUploadComplete(publicUrl);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Errore durante il caricamento');
      setUploading(false);
      setProgress(0);
    }
  };

  const removePreview = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-3">
      {preview && type === 'cover' && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={removePreview}
            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentUrl && type === 'file' && !uploading && (
        <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FileText className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-green-800 font-medium">File caricato</p>
            <p className="text-xs text-green-600 truncate">{currentUrl}</p>
          </div>
          <button
            type="button"
            onClick={removePreview}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <input
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`file-upload-${type}`}
        />
        <label
          htmlFor={`file-upload-${type}`}
          className={`flex items-center justify-center space-x-2 px-6 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            uploading
              ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-brand-burgundy hover:bg-brand-burgundy/5'
          }`}
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-600 font-medium">Caricamento... {progress}%</span>
            </>
          ) : (
            <>
              {type === 'cover' ? (
                <ImageIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <FileText className="w-5 h-5 text-gray-500" />
              )}
              <span className="text-gray-700 font-medium">
                {type === 'cover' ? 'Carica Copertina' : 'Carica PDF/File'}
              </span>
              <Upload className="w-4 h-4 text-gray-500" />
            </>
          )}
        </label>

        {uploading && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 flex items-center">
            <X className="w-4 h-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {type === 'cover'
          ? `Formati: JPG, PNG, WEBP. Max ${maxSizeMB}MB`
          : `Formati: PDF, ZIP, EPUB. Max ${maxSizeMB}MB`
        }
      </p>
    </div>
  );
}
