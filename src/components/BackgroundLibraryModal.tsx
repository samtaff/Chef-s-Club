import React, { useRef, useState } from 'react';
import { BackgroundItem } from '../types';
import { compressImageFile } from '../utils/storage';
import { X, Check, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';

interface BackgroundLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgrounds: BackgroundItem[];
  currentBackgroundId: string;
  onSelectBackground: (bgId: string, applyToAll: boolean) => void;
  onAddCustomBackground: (newBg: BackgroundItem) => void;
  title?: string;
}

export const BackgroundLibraryModal: React.FC<BackgroundLibraryModalProps> = ({
  isOpen,
  onClose,
  backgrounds,
  currentBackgroundId,
  onSelectBackground,
  onAddCustomBackground,
  title = 'Choisir le Fond du Menu',
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentBackgroundId);
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCustomUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.85);
      const newBg: BackgroundItem = {
        id: `custom-bg-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '') || 'Fond personnalisé',
        url: dataUrl,
        isCustom: true,
      };
      onAddCustomBackground(newBg);
      setSelectedId(newBg.id);
    } catch (err) {
      console.error('Erreur chargement fond', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    onSelectBackground(selectedId, applyToAll);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-700 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-xs text-slate-600">
                L&apos;image ou texture sera appliquée directement sur la carte de menu (l&apos;arrière-plan reste blanc pur)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white/30">
          {/* Grid of Backgrounds */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {backgrounds.map((bg) => {
              const isSelected = selectedId === bg.id;
              return (
                <div
                  key={bg.id}
                  onClick={() => setSelectedId(bg.id)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all shadow-xs ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-400/40 scale-[1.02] shadow-md'
                      : 'border-white/80 hover:border-blue-400 bg-white'
                  }`}
                >
                  <div className="aspect-4/3 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={bg.thumbnail || bg.url}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Selected Check icon */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-white text-left border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{bg.name}</p>
                  </div>
                </div>
              );
            })}

            {/* Custom upload card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer flex flex-col items-center justify-center p-3 text-center transition-all bg-white/60 shadow-xs"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCustomUpload(e.target.files[0]);
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                {isUploading ? 'Chargement...' : 'Importer un fond'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Image perso</span>
            </div>
          </div>

          {/* Option Apply to all days */}
          <div className="p-4 bg-white/70 rounded-xl border border-white/80 shadow-xs flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Appliquer ce fond à toute la semaine
                </span>
                <p className="text-[11px] text-slate-500">
                  Uniformise le fond pour la page de garde et les 5 jours (Lundi au Vendredi)
                </p>
              </div>
            </label>
            <Sparkles className="w-4 h-4 text-amber-600 hidden sm:block" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-white/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
          >
            Annuler
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Sélectionner ce fond
          </button>
        </div>
      </div>
    </div>
  );
};
