import React, { useState, useRef } from 'react';
import { PhotoCategory, PhotoLibraryItem } from '../types';
import { ImageCropModal } from './ImageCropModal';
import {
  X,
  Upload,
  Search,
  Check,
  Trash2,
  Image as ImageIcon,
  Plus,
  Edit2,
  FolderOpen,
  FolderPlus,
  Crop,
  Eye,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

interface PhotoLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoUrl: string) => void;
  photos: PhotoLibraryItem[];
  onAddPhoto: (newPhoto: PhotoLibraryItem) => void;
  onDeletePhoto: (id: string) => void;
  onUpdatePhoto?: (updatedPhoto: PhotoLibraryItem) => void;
  onResetDefaultPhotos?: () => void;
  currentSelectedUrl?: string;
}

const CATEGORIES_LIST: { id: 'all' | PhotoCategory; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'viande', label: 'Viandes' },
  { id: 'poisson', label: 'Poissons' },
  { id: 'vegetarien', label: 'Végétarien' },
  { id: 'plat', label: 'Plats cuisinés' },
  { id: 'entree', label: 'Entrées' },
  { id: 'dessert', label: 'Desserts' },
  { id: 'autre', label: 'Autre' },
];

export const PhotoLibraryModal: React.FC<PhotoLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  photos,
  onAddPhoto,
  onDeletePhoto,
  onUpdatePhoto,
  onResetDefaultPhotos,
  currentSelectedUrl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhotoCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Preview Modal State for clicked photo
  const [previewPhoto, setPreviewPhoto] = useState<PhotoLibraryItem | null>(null);

  // Upload custom fields
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('plat');
  const [pendingRawUrl, setPendingRawUrl] = useState<string | null>(null);
  const [pendingCroppedUrl, setPendingCroppedUrl] = useState<string | null>(null);

  // Cropper Modal State
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [cropperSourceImage, setCropperSourceImage] = useState<string | null>(null);
  const [cropperTargetPhoto, setCropperTargetPhoto] = useState<PhotoLibraryItem | null>(null);

  // Replace photo file target
  const [replaceTargetPhoto, setReplaceTargetPhoto] = useState<PhotoLibraryItem | null>(null);

  // Editing existing photo meta state
  const [editingPhoto, setEditingPhoto] = useState<PhotoLibraryItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredPhotos = photos.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (catId: 'all' | PhotoCategory) => {
    if (catId === 'all') return photos.length;
    return photos.filter((p) => p.category === catId).length;
  };

  // Upload New Photo Handler
  const handleFilePicked = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const autoTitle = file.name.replace(/\.[^/.]+$/, '');
    setUploadName(autoTitle);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      setPendingRawUrl(rawUrl);
      setCropperTargetPhoto(null);
      setCropperSourceImage(rawUrl);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Replace Existing Photo File Handler
  const handleReplaceFilePicked = (file: File) => {
    if (!file.type.startsWith('image/') || !replaceTargetPhoto) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      setCropperTargetPhoto(replaceTargetPhoto);
      setCropperSourceImage(rawUrl);
      setIsCropperOpen(true);
      setReplaceTargetPhoto(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerReplacePhoto = (photo: PhotoLibraryItem) => {
    setReplaceTargetPhoto(photo);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleCropConfirmed = (croppedDataUrl: string) => {
    setIsCropperOpen(false);

    if (cropperTargetPhoto) {
      // We were replacing or recropping an existing photo from the gallery
      const updated: PhotoLibraryItem = {
        ...cropperTargetPhoto,
        url: croppedDataUrl,
        originalUrl: cropperSourceImage || cropperTargetPhoto.originalUrl || croppedDataUrl,
      };
      if (onUpdatePhoto) {
        onUpdatePhoto(updated);
      }
      // If the preview modal was open for this photo, update it too
      if (previewPhoto && previewPhoto.id === cropperTargetPhoto.id) {
        setPreviewPhoto(updated);
      }
      setCropperTargetPhoto(null);
      setCropperSourceImage(null);
    } else {
      // We cropped a new upload
      setPendingCroppedUrl(croppedDataUrl);
      setCropperSourceImage(null);
    }
  };

  const handleRecropPending = () => {
    if (pendingRawUrl || pendingCroppedUrl) {
      setCropperTargetPhoto(null);
      setCropperSourceImage(pendingRawUrl || pendingCroppedUrl);
      setIsCropperOpen(true);
    }
  };

  const handleRecropExistingPhoto = (photo: PhotoLibraryItem) => {
    setCropperTargetPhoto(photo);
    setCropperSourceImage(photo.originalUrl || photo.url);
    setIsCropperOpen(true);
  };

  const handleConfirmUpload = async (applyToTarget: boolean = false) => {
    if (!pendingCroppedUrl) return;
    setIsUploading(true);
    try {
      const name = uploadName.trim() || 'Assiette de plat';
      const newPhotoItem: PhotoLibraryItem = {
        id: `custom-photo-${Date.now()}`,
        name: name,
        category: uploadCategory,
        url: pendingCroppedUrl,
        originalUrl: pendingRawUrl || pendingCroppedUrl,
        isCustom: true,
        createdAt: Date.now(),
      };
      onAddPhoto(newPhotoItem);
      if (applyToTarget) {
        onSelectPhoto(pendingCroppedUrl);
        onClose();
      }
      setPendingCroppedUrl(null);
      setPendingRawUrl(null);
      setUploadName('');
    } catch (err) {
      console.error('Erreur lors de l’enregistrement de la photo', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto || !editingPhoto.name.trim()) return;

    if (onUpdatePhoto) {
      onUpdatePhoto(editingPhoto);
    }
    if (previewPhoto && previewPhoto.id === editingPhoto.id) {
      setPreviewPhoto(editingPhoto);
    }
    setEditingPhoto(null);
  };

  const handleDeleteConfirmed = (photo: PhotoLibraryItem) => {
    if (
      window.confirm(
        `Voulez-vous vraiment supprimer "${photo.name}" de la bibliothèque ?`
      )
    ) {
      onDeletePhoto(photo.id);
      if (previewPhoto && previewPhoto.id === photo.id) {
        setPreviewPhoto(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Bibliothèque &amp; Cadrage des Assiettes
              </h2>
              <p className="text-xs text-slate-600">
                Aperçu 3D grand format, remplacement d'image, recadrage circulaire et suppression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetDefaultPhotos && (
              <button
                type="button"
                onClick={onResetDefaultPhotos}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Restaurer le catalogue d'exemples originaux du Chef"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurer catalogue</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload Form / Pending File Modal Section */}
        <div className="p-6 pb-3 space-y-4 border-b border-slate-200/80 bg-white/40">
          {pendingCroppedUrl ? (
            /* Upload Configuration Panel with Circular Cropped Preview */
            <div className="bg-white/95 border border-amber-400/60 rounded-2xl p-4 space-y-3 animate-in fade-in shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" />
                  Ranger et nommer la nouvelle photo cadrée
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setPendingCroppedUrl(null);
                    setPendingRawUrl(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Plate Preview with deep shadow and circular crop */}
                <div className="relative group/recrop shrink-0">
                  <div
                    style={{
                      boxShadow:
                        '0 16px 28px -4px rgba(0, 0, 0, 0.38), 0 8px 12px -2px rgba(0, 0, 0, 0.22), inset 0 2px 3px rgba(255, 255, 255, 0.8)',
                    }}
                    className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white ring-1 ring-amber-500/50 bg-white"
                  >
                    <img
                      src={pendingCroppedUrl}
                      alt="Aperçu Cadré"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRecropPending}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Recadrer l'assiette"
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom de la photo / plat
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Pavé de cabillaud rôti"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as PhotoCategory)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 capitalize"
                    >
                      <option value="plat">Plat cuisiné</option>
                      <option value="viande">Viande</option>
                      <option value="poisson">Poisson</option>
                      <option value="vegetarien">Végétarien</option>
                      <option value="entree">Entrée</option>
                      <option value="dessert">Dessert</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleConfirmUpload(false)}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    title="Enregistre la photo dans la bibliothèque sans remplacer le plat"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Ajouter à la bibliothèque</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmUpload(true)}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Ajouter &amp; Appliquer au plat</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Import Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-500 hover:bg-white/70 bg-white/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files) as File[];
                    files.forEach((f: File, idx: number) => {
                      if (idx === 0) {
                        handleFilePicked(f);
                      } else {
                        // Batch load into library directly
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string;
                          if (url) {
                            onAddPhoto({
                              id: `custom-photo-${Date.now()}-${idx}`,
                              name: f.name.replace(/\.[^/.]+$/, ''),
                              category: 'plat',
                              url,
                              originalUrl: url,
                              isCustom: true,
                              createdAt: Date.now(),
                            });
                          }
                        };
                        reader.readAsDataURL(f);
                      }
                    });
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Ajouter une nouvelle photo de plat
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Glissez-déposez ou cliquez pour importer une image (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-amber-400 font-bold rounded-xl text-xs text-slate-700 shadow-2xs shrink-0 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                Parcourir
              </span>
            </div>
          )}

          {/* Search bar & Category filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES_LIST.map((cat) => {
                const count = getCategoryCount(cat.id);
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une photo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white/30">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Aucune photo trouvée</p>
              <p className="text-xs text-slate-500 mt-1">
                Importez une photo ou sélectionnez une autre catégorie
              </p>
            </div>
          ) : (
            filteredPhotos.map((photo) => {
              const isSelected = currentSelectedUrl === photo.url;
              return (
                <div
                  key={photo.id}
                  onClick={() => setPreviewPhoto(photo)}
                  className={`group relative flex flex-col items-center bg-white/80 border rounded-2xl p-3 cursor-pointer transition-all hover:border-blue-500 hover:shadow-2xl hover:scale-[1.02] ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/50'
                      : 'border-white/80 shadow-xs'
                  }`}
                >
                  {/* Circular Plate Thumbnail with deep 3D shadow and hover effects */}
                  <div className="relative aspect-square w-full max-w-[136px] flex items-center justify-center my-1">
                    {/* Ambient Contact Shadow */}
                    <div
                      style={{
                        background: 'radial-gradient(circle, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)',
                      }}
                      className="absolute w-[86%] h-[86%] rounded-full blur-[6px] translate-y-3 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Elevated Plate */}
                    <div
                      style={{
                        boxShadow:
                          '0 16px 28px -4px rgba(0, 0, 0, 0.40), 0 8px 12px -2px rgba(0, 0, 0, 0.22), inset 0 2px 3px rgba(255, 255, 255, 0.7)',
                      }}
                      className="w-full h-full rounded-full overflow-hidden border-[3.5px] border-white bg-white group-hover:ring-2 group-hover:ring-blue-500/60 transition-all duration-300 relative z-10"
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                    </div>

                    {/* Preview overlay on hover */}
                    <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px] z-20">
                      <div className="flex items-center gap-1 bg-black/70 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-md">
                        <Eye className="w-3 h-3" />
                        <span>Aperçu</span>
                      </div>
                    </div>

                    {/* Selected Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg font-bold ring-2 ring-white z-30">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Photo Title and Category */}
                  <div className="w-full text-center mt-2 space-y-1">
                    <p className="text-xs font-bold text-slate-800 truncate px-1" title={photo.name}>
                      {photo.name}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      {photo.category && (
                        <span className="px-1.5 py-0.2 bg-slate-100 text-[9px] font-bold text-slate-600 rounded border border-slate-200 capitalize">
                          {photo.category}
                        </span>
                      )}
                      {photo.isCustom && (
                        <span className="px-1.5 py-0.2 bg-blue-600 text-[9px] font-bold text-white rounded">
                          Perso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons on Hover */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerReplacePhoto(photo);
                      }}
                      className="p-1.5 rounded-full bg-white text-blue-700 hover:text-white hover:bg-blue-600 transition-colors shadow-md cursor-pointer border border-slate-200"
                      title="Changer l'image (Remplacer par un fichier)"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecropExistingPhoto(photo);
                      }}
                      className="p-1.5 rounded-full bg-white text-amber-800 hover:text-white hover:bg-amber-600 transition-colors shadow-md cursor-pointer border border-slate-200"
                      title="Recadrer l'assiette"
                    >
                      <Crop className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPhoto(photo);
                      }}
                      className="p-1.5 rounded-full bg-white text-slate-700 hover:text-white hover:bg-slate-800 transition-colors shadow-md cursor-pointer border border-slate-200"
                      title="Modifier les détails"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfirmed(photo);
                      }}
                      className="p-1.5 rounded-full bg-white text-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-md cursor-pointer border border-slate-200"
                      title="Supprimer cette photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 bg-white/60 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            {photos.length} photos disponibles dans votre galerie restaurant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ----------------- PHOTO DETAIL PREVIEW MODAL ----------------- */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative w-full max-w-md bg-white border border-white/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Preview */}
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Category */}
            <div className="space-y-1">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider">
                {previewPhoto.category || 'Plat'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-serif-title px-4 pt-1">
                {previewPhoto.name}
              </h3>
            </div>

            {/* Large Circular Plate Preview with Deep Realistic 3D Shadow */}
            <div className="relative py-3 flex items-center justify-center">
              {/* Floor Shadow Ambient Occlusion */}
              <div
                style={{
                  background: 'radial-gradient(circle, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0) 75%)',
                }}
                className="absolute w-48 h-48 rounded-full blur-[10px] translate-y-4 pointer-events-none"
              />

              {/* Elevated Plate */}
              <div
                style={{
                  boxShadow:
                    '0 24px 42px -6px rgba(0, 0, 0, 0.50), 0 12px 20px -3px rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0, 0, 0, 0.25)',
                }}
                className="w-52 h-52 rounded-full overflow-hidden border-[4.5px] border-white bg-white ring-1 ring-black/10 mx-auto relative z-10"
              >
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectPhoto(previewPhoto.url);
                  setPreviewPhoto(null);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Choisir cette photo pour le plat</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = previewPhoto;
                    triggerReplacePhoto(target);
                  }}
                  className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  title="Remplacer cette image par un nouveau fichier"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Changer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = previewPhoto;
                    handleRecropExistingPhoto(target);
                  }}
                  className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  title="Recadrer l'assiette en cercle"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Recadrer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = previewPhoto;
                    setEditingPhoto(target);
                  }}
                  className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  title="Modifier le nom et la catégorie"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Renommer</span>
                </button>
              </div>

              {/* Delete Button for ANY photo with confirmation */}
              <button
                type="button"
                onClick={() => handleDeleteConfirmed(previewPhoto)}
                className="w-full py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer cette photo de la bibliothèque</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Details Modal */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingPhoto(null)}
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Modifier la photo</h4>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre du plat
              </label>
              <input
                type="text"
                value={editingPhoto.name}
                onChange={(e) =>
                  setEditingPhoto({ ...editingPhoto, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie
              </label>
              <select
                value={editingPhoto.category}
                onChange={(e) =>
                  setEditingPhoto({
                    ...editingPhoto,
                    category: e.target.value as PhotoCategory,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white capitalize"
              >
                <option value="plat">Plat cuisiné</option>
                <option value="viande">Viande</option>
                <option value="poisson">Poisson</option>
                <option value="vegetarien">Végétarien</option>
                <option value="entree">Entrée</option>
                <option value="dessert">Dessert</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hidden file input for Replace Existing Photo */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleReplaceFilePicked(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Image Cropper Modal Layer */}
      <ImageCropModal
        isOpen={isCropperOpen}
        imageSrc={cropperSourceImage}
        title={cropperTargetPhoto ? `Recadrer : ${cropperTargetPhoto.name}` : 'Cadrage Circulaire de l’Assiette'}
        onClose={() => {
          setIsCropperOpen(false);
          setCropperSourceImage(null);
          setCropperTargetPhoto(null);
        }}
        onConfirmCrop={handleCropConfirmed}
      />
    </div>
  );
};
