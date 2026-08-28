import React, { useState, useRef } from 'react';
import {
  BackgroundItem,
  DayId,
  DayMenu,
  Dish,
  DishBadge,
  MenuTemplateId,
  PhotoLibraryItem,
  WeeklyMenuData,
} from '../types';
import { MENU_TEMPLATES } from '../data/templates';
import { AllergenBadge } from './AllergenBadge';
import { BadgeRenderer, BadgesList } from './BadgeRenderer';
import { DEFAULT_BADGES } from '../data/badges';
import { ImageCropModal } from './ImageCropModal';
import {
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Crop,
  Award,
  Plus,
  X,
  Upload,
  Trash2,
} from 'lucide-react';

interface MenuEditorProps {
  menuData: WeeklyMenuData;
  activeTab: 'cover' | DayId;
  onSelectTab: (tab: 'cover' | DayId) => void;
  onUpdateMenu: (updated: WeeklyMenuData) => void;
  backgrounds: BackgroundItem[];
  photos: PhotoLibraryItem[];
  onOpenPhotoModal: (dishIndex?: number, isCoverPhotoIndex?: number) => void;
  onOpenBackgroundModal: () => void;
  onOpenAllergenModal: (dishIndex: number) => void;
  onLoadExampleMenu: () => void;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({
  menuData,
  activeTab,
  onSelectTab,
  onUpdateMenu,
  backgrounds,
  photos,
  onOpenPhotoModal,
  onOpenBackgroundModal,
  onOpenAllergenModal,
  onLoadExampleMenu,
}) => {
  const isCover = activeTab === 'cover';
  const currentDay: DayMenu | undefined = !isCover ? menuData.days[activeTab as DayId] : undefined;
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  // In-place Dish Cropping
  const [dishCropperTarget, setDishCropperTarget] = useState<{
    dishIndex: number;
    imageSrc: string;
    dishName: string;
  } | null>(null);
  const dishDirectFileInputRef = useRef<HTMLInputElement>(null);
  const [directUploadIndex, setDirectUploadIndex] = useState<number | null>(null);

  // Custom Badge Input per dish
  const [newCustomBadgeText, setNewCustomBadgeText] = useState<{ [dishIdx: number]: string }>({});

  const toggleDishBadge = (dishIdx: number, badgeId: string) => {
    if (!currentDay) return;
    const dish = currentDay.dishes[dishIdx];
    if (!dish) return;

    let currentBadges: string[] = [];
    if (Array.isArray(dish.badges) && dish.badges.length > 0) {
      currentBadges = dish.badges.map((b) => (b === 'viande-francaise' ? 'vf' : b));
    } else if (dish.showFrenchMeat) {
      currentBadges = ['vf'];
    }

    let updatedBadges: string[];
    if (currentBadges.includes(badgeId)) {
      updatedBadges = currentBadges.filter((id) => id !== badgeId);
    } else {
      updatedBadges = [...currentBadges, badgeId];
    }

    updateDish(dishIdx, {
      badges: updatedBadges,
      showFrenchMeat: updatedBadges.length > 0,
    });
  };

  const handleAddCustomBadge = (dishIdx: number) => {
    const text = (newCustomBadgeText[dishIdx] || '').trim();
    if (!text) return;
    toggleDishBadge(dishIdx, text);
    setNewCustomBadgeText((prev) => ({ ...prev, [dishIdx]: '' }));
  };

  const handleDirectDishFilePicked = (file: File, dishIndex: number) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      setDishCropperTarget({
        dishIndex,
        imageSrc: rawUrl,
        dishName: currentDay?.dishes[dishIndex]?.name || `Plat ${dishIndex + 1}`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDishCropConfirmed = (croppedDataUrl: string) => {
    if (dishCropperTarget) {
      updateDish(dishCropperTarget.dishIndex, { imageUrl: croppedDataUrl });
      setDishCropperTarget(null);
    }
  };

  // Template Updater
  const currentTemplateId = menuData.templateId || 'classic-navy';
  const currentTemplate = MENU_TEMPLATES[currentTemplateId] || MENU_TEMPLATES['classic-navy'];

  const handleSelectTemplate = (templateId: MenuTemplateId) => {
    onUpdateMenu({
      ...menuData,
      templateId,
    });
  };

  // Day Updater
  const updateDayData = (updater: (prev: DayMenu) => DayMenu) => {
    if (isCover) return;
    const dayKey = activeTab as DayId;
    const updatedDay = updater(menuData.days[dayKey]);
    onUpdateMenu({
      ...menuData,
      days: {
        ...menuData.days,
        [dayKey]: updatedDay,
      },
    });
  };

  // Dish Updater
  const updateDish = (index: number, partial: Partial<Dish>) => {
    updateDayData((prev) => {
      const newDishes = [...prev.dishes];
      newDishes[index] = { ...newDishes[index], ...partial };
      return { ...prev, dishes: newDishes };
    });
  };

  // Toggle Dish Count (2 or 3)
  const setDishCount = (count: 2 | 3) => {
    updateDayData((prev) => {
      let dishes = [...prev.dishes];
      if (dishes.length < count) {
        // Add a default third dish if missing
        dishes.push({
          id: `dish-${prev.id}-3`,
          name: 'Plat Végétarien du Chef & garniture de saison',
          allergens: [1, 7],
          showFrenchMeat: false,
          imageUrl: photos[2]?.url || photos[0]?.url || '',
        });
      }
      return {
        ...prev,
        dishCount: count,
        dishes,
      };
    });
  };

  // Days configuration for tabs
  const tabList: { id: 'cover' | DayId; label: string; sub: string }[] = [
    { id: 'cover', label: 'Garde', sub: 'Page de garde' },
    { id: 'monday', label: 'Lundi', sub: menuData.days.monday.dateFormatted || '31/08' },
    { id: 'tuesday', label: 'Mardi', sub: menuData.days.tuesday.dateFormatted || '01/09' },
    { id: 'wednesday', label: 'Mercredi', sub: menuData.days.wednesday.dateFormatted || '02/09' },
    { id: 'thursday', label: 'Jeudi', sub: menuData.days.thursday.dateFormatted || '03/09' },
    { id: 'friday', label: 'Vendredi', sub: menuData.days.friday.dateFormatted || '04/09' },
  ];

  // Active Background Name
  const currentBgId = isCover
    ? menuData.cover.backgroundId
    : currentDay?.backgroundId;
  const currentBg = backgrounds.find((b) => b.id === currentBgId) || backgrounds[0];

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl overflow-hidden h-full text-slate-800">
      {/* Top Navigation Tabs */}
      <div className="bg-white/50 p-2 border-b border-white/60">
        <div className="grid grid-cols-6 gap-1.5">
          {tabList.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'bg-white/40 text-slate-700 hover:text-slate-900 hover:bg-white/70 border border-white/40'
                }`}
              >
                <span className="text-xs sm:text-sm leading-tight">{tab.label}</span>
                <span className={`text-[10px] truncate max-w-[55px] ${isActive ? 'text-blue-100 font-semibold' : 'text-slate-500'}`}>
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        
        {/* Style Template & Background Bar */}
        <div className="space-y-2">
          <div className="p-3 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 flex flex-col gap-3 shadow-xs">
            {/* Template Selector Trigger */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: currentTemplate.primaryColor }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/40 text-amber-300 shadow-xs shrink-0"
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Template &amp; Thème Visuel
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[170px] sm:max-w-[240px] block">
                    {currentTemplate.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTemplatePickerOpen(!isTemplatePickerOpen)}
                className="px-2.5 py-1.5 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Changer</span>
                {isTemplatePickerOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            </div>

            {/* Template Chooser Drawer */}
            {isTemplatePickerOpen && (
              <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 gap-2 animate-in fade-in">
                {Object.values(MENU_TEMPLATES).map((tmpl) => {
                  const isSelected = tmpl.id === currentTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        handleSelectTemplate(tmpl.id);
                        setIsTemplatePickerOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 text-blue-950 shadow-xs ring-1 ring-blue-400/40'
                          : 'border-white/60 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Swatch */}
                        <div
                          style={{
                            backgroundColor: tmpl.primaryColor,
                            borderColor: tmpl.accentColor,
                          }}
                          className="w-7 h-7 rounded-full border-2 shadow-xs shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900">{tmpl.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{tmpl.description}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-100 shrink-0">
                          Actif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Background Selector Quick Row */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-300 shrink-0 shadow-xs">
                  <img
                    src={currentBg?.thumbnail || currentBg?.url}
                    alt="Fond"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-slate-600 truncate max-w-[150px]">
                  Fond : <span className="text-slate-900 font-semibold">{currentBg?.name}</span>
                </span>
              </div>

              <button
                onClick={onOpenBackgroundModal}
                className="px-2.5 py-1 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <ImageIcon className="w-3 h-3 text-blue-600" />
                Fonds ({backgrounds.length})
              </button>
            </div>
          </div>
        </div>

        {/* ----------------- COVER PAGE EDITOR ----------------- */}
        {isCover && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Paramètres de la Page de Garde
              </h3>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du Restaurant / Enseigne
                </label>
                <input
                  type="text"
                  value={menuData.cover.brandName}
                  onChange={(e) =>
                    onUpdateMenu({
                      ...menuData,
                      cover: { ...menuData.cover, brandName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-semibold tracking-wider uppercase shadow-2xs"
                />
              </div>

              {/* Date range fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date de début (du...)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 31 Août ou 31/08"
                    value={menuData.cover.startDate}
                    onChange={(e) =>
                      onUpdateMenu({
                        ...menuData,
                        cover: { ...menuData.cover, startDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date de fin (au...)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 04 Septembre ou 04/09"
                    value={menuData.cover.endDate}
                    onChange={(e) =>
                      onUpdateMenu({
                        ...menuData,
                        cover: { ...menuData.cover, endDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Year / Extra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Année (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: 2026"
                  value={menuData.cover.year}
                  onChange={(e) =>
                    onUpdateMenu({
                      ...menuData,
                      cover: { ...menuData.cover, year: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white shadow-2xs"
                />
              </div>

              {/* Cover layout information note */}
              <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2 text-slate-600 text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  La page de garde met en valeur le titre de la semaine, les dates et l&apos;enseigne avec un style héraldique épuré.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- DAY PAGE EDITOR (Lundi to Vendredi) ----------------- */}
        {!isCover && currentDay && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header: Date + 2/3 Dishes Toggle */}
            <div className="p-4 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Date for the day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date affichée pour {currentDay.dayName}
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 31/08 ou 31 Août"
                    value={currentDay.dateFormatted}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, dateFormatted: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-semibold shadow-2xs"
                  />
                </div>

                {/* 2 or 3 dishes toggle selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de plats sur la page
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-white/60 p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setDishCount(2)}
                      className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        currentDay.dishCount === 2
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      2 Plats
                    </button>

                    <button
                      type="button"
                      onClick={() => setDishCount(3)}
                      className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        currentDay.dishCount === 3
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      3 Plats
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dishes List Accordion / Cards */}
            <div className="space-y-3">
              {currentDay.dishes.slice(0, currentDay.dishCount).map((dish, idx) => (
                <div
                  key={dish.id || idx}
                  className="p-4 bg-white/50 backdrop-blur-xs border border-white/70 rounded-xl space-y-3 relative group shadow-xs"
                >
                  {/* Dish header badge & Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      Plat {idx + 1}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Direct File Upload button for dish */}
                      <label
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                        title="Importer directement une photo depuis votre appareil"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Importer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                if (result) {
                                  updateDish(idx, { imageUrl: result });
                                  setDishCropperTarget({
                                    dishIndex: idx,
                                    imageSrc: result,
                                    dishName: dish.name || `Plat ${idx + 1}`,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>

                      {dish.imageUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDishCropperTarget({
                                dishIndex: idx,
                                imageSrc: dish.imageUrl,
                                dishName: dish.name || `Plat ${idx + 1}`,
                              })
                            }
                            className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                            title="Recadrer l'assiette en cercle"
                          >
                            <Crop className="w-3 h-3" />
                            <span>Recadrer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDish(idx, { imageUrl: undefined })}
                            className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer"
                            title="Retirer la photo du plat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPhotoModal(idx)}
                        className="text-[11px] text-slate-700 hover:text-slate-950 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                        title="Choisir parmi la galerie de photos"
                      >
                        <ImageIcon className="w-3 h-3 text-amber-600" />
                        <span>Galerie</span>
                      </button>
                    </div>
                  </div>

                  {/* Dish Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Intitulé du plat
                    </label>
                    <textarea
                      rows={2}
                      value={dish.name}
                      onChange={(e) => updateDish(idx, { name: e.target.value })}
                      placeholder="ex: Pavé de saumon rôti, tombée d'épinards..."
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium leading-relaxed resize-none shadow-2xs"
                    />
                  </div>

                    {/* Photo & Options row */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
                      {/* Photo thumbnail with deep 3D drop shadow preview */}
                      <div className="relative group/thumb shrink-0 self-center sm:self-start">
                        <div
                          style={{
                            background: 'radial-gradient(circle, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)',
                          }}
                          className="absolute w-16 h-16 rounded-full blur-[4px] translate-y-2 pointer-events-none opacity-80"
                        />
                        <div
                          onClick={() => {
                            if (dish.imageUrl) {
                              setDishCropperTarget({
                                dishIndex: idx,
                                imageSrc: dish.imageUrl,
                                dishName: dish.name || `Plat ${idx + 1}`,
                              });
                            } else {
                              onOpenPhotoModal(idx);
                            }
                          }}
                          style={{
                            boxShadow:
                              '0 12px 22px -3px rgba(0, 0, 0, 0.35), 0 6px 10px -2px rgba(0, 0, 0, 0.20), inset 0 2px 3px rgba(255, 255, 255, 0.75)',
                          }}
                          className="relative w-18 h-18 rounded-full overflow-hidden border-[3px] border-white ring-1 ring-slate-300 hover:ring-blue-500 cursor-pointer bg-white transition-all z-10"
                          title={dish.imageUrl ? 'Cliquer pour recadrer en rond' : 'Choisir une photo'}
                        >
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center transition-opacity text-[8px] text-white font-bold">
                            <Crop className="w-3.5 h-3.5 mb-0.5" />
                            {dish.imageUrl ? 'Cadrer' : 'Choisir'}
                          </div>
                        </div>
                      </div>

                      {/* Allergen selector + Badges System */}
                      <div className="flex-1 w-full space-y-3">
                        {/* Allergens Button */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-700">
                              Allergènes :
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenAllergenModal(idx)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline"
                            >
                              Modifier ({dish.allergens.length})
                            </button>
                          </div>

                          {/* Allergen preview pills */}
                          <div
                            onClick={() => onOpenAllergenModal(idx)}
                            className="p-1.5 bg-white/80 rounded-lg border border-slate-300 cursor-pointer hover:border-blue-400 flex items-center min-h-[30px] shadow-2xs transition-all"
                          >
                            {dish.allergens && dish.allergens.length > 0 ? (
                              <AllergenBadge
                                allergens={dish.allergens}
                                customText={dish.customAllergenText}
                                size="sm"
                                showLabel={false}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 italic pl-1">
                                Aucun allergène sélectionné (cliquez pour choisir)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* French Meat Badges Selector (VBF, VF, LPF) */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                              <span className="inline-flex overflow-hidden rounded-[1.5px] border border-slate-300 w-3 h-3.5 shrink-0 shadow-2xs">
                                <span className="w-1/3 h-full bg-[#002654]" />
                                <span className="w-1/3 h-full bg-white" />
                                <span className="w-1/3 h-full bg-[#ED2939]" />
                              </span>
                              Badges Viandes Françaises :
                            </span>
                            {((dish.badges && dish.badges.length > 0) || dish.showFrenchMeat) && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateDish(idx, { badges: [], showFrenchMeat: false })
                                }
                                className="text-[10px] text-slate-400 hover:text-red-600 font-semibold cursor-pointer"
                              >
                                Effacer
                              </button>
                            )}
                          </div>

                          {/* Badges Selection Chips (VBF, VF, LPF) */}
                          <div className="flex items-center gap-2">
                            {DEFAULT_BADGES.map((badge) => {
                              const activeDishBadges = Array.isArray(dish.badges) && dish.badges.length > 0
                                ? dish.badges.map((b) => (b === 'viande-francaise' ? 'vf' : b))
                                : (dish.showFrenchMeat ? ['vf'] : []);
                              const isSelected = activeDishBadges.includes(badge.id);
                              return (
                                <button
                                  key={badge.id}
                                  type="button"
                                  onClick={() => toggleDishBadge(idx, badge.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none shadow-2xs ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300/50'
                                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                                  }`}
                                  title={badge.fullName || badge.label}
                                >
                                  <div className="flex overflow-hidden rounded-[1.5px] border border-slate-300/80 w-2.5 h-3 shrink-0">
                                    <div className="w-1/3 h-full bg-[#002654]" />
                                    <div className="w-1/3 h-full bg-white" />
                                    <div className="w-1/3 h-full bg-[#ED2939]" />
                                  </div>
                                  <span>{badge.label}</span>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            VBF (Viande Bovine Française), VF (Viande Française), LPF (Le Porc Français)
                          </p>
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Helper Actions */}
      <div className="px-4 py-3 bg-white/50 border-t border-white/60 flex items-center justify-between text-xs text-slate-600">
        <button
          onClick={onLoadExampleMenu}
          className="text-amber-700 hover:text-amber-900 flex items-center gap-1.5 font-bold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Remplir avec le menu du Chef
        </button>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Sauvegardé automatiquement</span>
        </div>
      </div>

      {/* Hidden file input for direct dish image import */}
      <input
        type="file"
        ref={dishDirectFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && directUploadIndex !== null) {
            handleDirectDishFilePicked(e.target.files[0], directUploadIndex);
            e.target.value = '';
          }
        }}
      />

      {/* Dish In-place Image Cropper Modal */}
      <ImageCropModal
        isOpen={!!dishCropperTarget}
        imageSrc={dishCropperTarget?.imageSrc || null}
        title={dishCropperTarget ? `Cadrer l'assiette : ${dishCropperTarget.dishName}` : 'Cadrage Circulaire de l’Assiette'}
        onClose={() => setDishCropperTarget(null)}
        onConfirmCrop={handleDishCropConfirmed}
      />
    </div>
  );
};

