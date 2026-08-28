import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area, getCroppedImg } from '../utils/cropImage';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Sparkles,
  Move,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Cadrage Circulaire de l’Assiette',
  subtitle = 'Déplacez la photo et ajustez le zoom pour centrer parfaitement le plat dans le cercle',
  onClose,
  onConfirmCrop,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedUrl = await getCroppedImg(imageSrc, croppedAreaPixels, 800);
      onConfirmCrop(croppedUrl);
    } catch (err) {
      console.error('Erreur lors du recadrage de l’image', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 bg-white/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h2>
              <p className="text-xs text-slate-600 truncate">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Work Area */}
        <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-950 overflow-hidden select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            zoomSpeed={0.15}
            minZoom={0.8}
            maxZoom={3.5}
            style={{
              containerStyle: {
                backgroundColor: '#090d16',
              },
              cropAreaStyle: {
                border: '3px solid #f59e0b',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
              },
            }}
          />

          {/* Floating interactive tip indicator */}
          <div className="absolute top-3 left-3 pointer-events-none bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
            <Move className="w-3 h-3 text-amber-400" />
            <span>Glissez pour déplacer l&apos;assiette</span>
          </div>

          {/* Zoom % pill */}
          <div className="absolute top-3 right-3 pointer-events-none bg-black/60 backdrop-blur-xs text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-full border border-white/20 shadow-md">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-5 bg-white/70 space-y-3.5 border-t border-slate-200/80">
          {/* Zoom slider + Quick adjustment buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0.8"
                  max="3.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Recentrer et réinitialiser le zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recentrer</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Molette de la souris ou geste de pincement également actifs</span>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-white/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-300"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isProcessing ? 'Génération du cadrage...' : 'Valider le cadrage'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
