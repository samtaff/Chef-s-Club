import React, { useRef, useState, useEffect } from 'react';
import { AllergenDef, BackgroundItem, DayMenu, MenuTemplateId } from '../types';
import { AllergenBadge } from './AllergenBadge';
import { BadgesList } from './BadgeRenderer';
import { UtensilsCrossed } from 'lucide-react';
import { MENU_TEMPLATES } from '../data/templates';

interface DayVisualCardProps {
  dayMenu: DayMenu;
  backgrounds: BackgroundItem[];
  templateId?: MenuTemplateId;
  allergensList?: AllergenDef[];
  id?: string;
  isExporting?: boolean;
}

export const DayVisualCard: React.FC<DayVisualCardProps> = ({
  dayMenu,
  backgrounds,
  templateId = 'classic-navy',
  allergensList,
  id = 'day-visual-card',
  isExporting = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const template = MENU_TEMPLATES[templateId] || MENU_TEMPLATES['classic-navy'];

  // Auto-scale to ensure 100% pixel-perfect layout at any display size (thumbnails, editor, 1080px export)
  useEffect(() => {
    if (isExporting) {
      setScale(1.5); // 720px base -> 1080px export canvas
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setScale(w / 720);
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isExporting]);

  // Resolve background image
  const activeBg =
    dayMenu.customBackgroundUrl ||
    backgrounds.find((b) => b.id === dayMenu.backgroundId)?.url ||
    backgrounds[0]?.url;

  const dishCount = dayMenu.dishCount;
  const dishes = dayMenu.dishes.slice(0, dishCount);

  // Helper to parse date into stacked day (DD) and month (MM) parts like "31" over "08"
  const parseDateParts = (dateStr?: string) => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // Matches DD/MM, DD.MM, DD-MM, DD MM
    const match = trimmed.match(/^(\d{1,2})[\/\.\-\s](\d{1,2}|[a-zA-ZÀ-ÿ]+)$/);
    if (match) {
      const d = match[1].padStart(2, '0');
      let m = match[2];
      if (/^\d+$/.test(m)) {
        m = m.padStart(2, '0');
      } else {
        const monthMap: Record<string, string> = {
          janv: '01', janvier: '01',
          fev: '02', 'fév': '02', 'février': '02', fevrier: '02',
          mars: '03',
          avr: '04', avril: '04',
          mai: '05',
          juin: '06',
          juil: '07', juillet: '07',
          aout: '08', 'août': '08',
          sept: '09', septembre: '09',
          oct: '10', octobre: '10',
          nov: '11', novembre: '11',
          dec: '12', 'déc': '12', 'décembre': '12', decembre: '12',
        };
        const clean = m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        m = monthMap[m.toLowerCase()] || monthMap[clean] || m.slice(0, 2);
      }
      return { dayPart: d, monthPart: m };
    }

    if (/^\d{4}$/.test(trimmed)) {
      return { dayPart: trimmed.slice(0, 2), monthPart: trimmed.slice(2, 4) };
    }

    if (/^\d{1,2}$/.test(trimmed)) {
      return { dayPart: trimmed.padStart(2, '0'), monthPart: '' };
    }

    const parts = trimmed.split(/[\/\.\-\s]+/);
    if (parts.length >= 2) {
      return {
        dayPart: parts[0].padStart(2, '0'),
        monthPart: /^\d+$/.test(parts[1]) ? parts[1].padStart(2, '0') : parts[1].slice(0, 2),
      };
    }

    return { dayPart: trimmed, monthPart: '' };
  };

  const dateParts = parseDateParts(dayMenu.dateFormatted);
  const formattedDayName = dayMenu.dayName
    ? dayMenu.dayName.trim().toUpperCase()
    : '';

  // Helper for adaptive linear sans-serif font size to ensure no title is ever cut off
  const getDishTitleClass = (name: string) => {
    const len = (name || '').trim().length;
    if (len <= 26) return 'text-[20px] leading-[1.22]';
    if (len <= 44) return 'text-[18px] leading-[1.20]';
    if (len <= 64) return 'text-[16px] leading-[1.18]';
    return 'text-[14.5px] leading-[1.15]';
  };

  return (
    <div
      ref={containerRef}
      id={id}
      data-visual-card="true"
      className="relative w-full aspect-square overflow-hidden bg-white select-none shadow-2xl"
    >
      {/* Scaled Canvas Container: Fixed 720x720 base canvas proportionally scaled */}
      <div
        className="absolute top-0 left-0 w-[720px] h-[720px] origin-top-left flex items-center justify-center pointer-events-none bg-white"
        style={{
          transform: `scale(${scale})`,
          width: '720px',
          height: '720px',
        }}
      >
        {/* Clean white backdrop behind the menu card */}
        <div className="absolute inset-0 bg-white" />

        {/* 2. Main Menu Card Container - with selectable background image & template overlay */}
        <div
          className={`relative w-[670px] h-[670px] shadow-2xl flex flex-col justify-between p-7 rounded-tl-[48px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl overflow-hidden ring-1 ring-black/5`}
        >
          {/* Card Custom / Selected Background Image */}
          {activeBg && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{
                backgroundImage: `url(${activeBg})`,
              }}
            />
          )}

          {/* Card Overlay / Gradient for crisp typography and readability */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${template.cardBgGradient} opacity-92`}
          />

          {/* Outer Border with decorative top-left rounded corner */}
          <div
            style={{ borderColor: template.borderColor }}
            className="absolute inset-3.5 border-[2.5px] pointer-events-none rounded-tl-[38px] rounded-tr-xl rounded-br-xl rounded-bl-xl z-10"
          >
            {/* Subtle inner decorative corner accents */}
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2"
            />
          </div>

          {/* 3. Header Section */}
          <header className="relative z-10 pt-1 px-4 flex flex-col">
            {/* Top Brand Bar */}
            <div
              style={{ borderColor: `${template.borderColor}25` }}
              className="flex items-center justify-center border-b pb-2 mb-2"
            >
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: template.crestBg, color: template.crestIconColor }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                >
                  <UtensilsCrossed className="w-3 h-3" />
                </div>
                <span
                  style={{ color: template.primaryColor }}
                  className="font-sans-clean text-xs font-extrabold tracking-[0.25em] uppercase"
                >
                  Chef&apos;s Club
                </span>
              </div>
            </div>

            {/* Day Title & Date (Prominent 45px Day Name + Matching Date in #001489) */}
            <div className="flex items-center justify-center gap-3.5 mt-1 select-none">
              <h1
                style={{ color: '#001489' }}
                className="font-sans-clean font-extrabold text-[45px] leading-none tracking-tight drop-shadow-2xs uppercase"
              >
                {formattedDayName}
              </h1>

              {dateParts && (
                <div
                  style={{ color: '#001489' }}
                  className="flex flex-col justify-center items-start font-sans-clean select-none tracking-tight h-[45px] pl-1.5 border-l-2 border-[#001489]/25"
                >
                  <span className="tabular-nums font-extrabold text-[24px] leading-none">
                    {dateParts.dayPart}
                  </span>
                  {dateParts.monthPart ? (
                    <span className="tabular-nums font-bold text-[15px] leading-none text-[#001489]/85 uppercase tracking-wide mt-0.5">
                      {dateParts.monthPart}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </header>

          {/* 4. Dishes Section (Strict horizontal row alignment across all columns) */}
          <main className="relative z-10 flex-1 my-auto px-2 flex items-center justify-center">
            <div
              className={`w-full grid ${
                dishCount === 2 ? 'grid-cols-2 gap-6' : 'grid-cols-3 gap-3'
              } items-center`}
            >
              {dishes.map((dish, index) => {
                const isLast = index === dishes.length - 1;
                const plateSize = 126;
                const ringSize = 136;

                return (
                  <div
                    key={dish.id || index}
                    style={{
                      borderColor: !isLast ? `${template.borderColor}30` : undefined,
                    }}
                    className={`relative h-full flex flex-col justify-center items-center text-center px-1.5 py-1 ${
                      !isLast ? 'border-r' : ''
                    }`}
                  >
                    {/* Centered Column Content with fixed row heights for 100% horizontal alignment */}
                    <div className="w-full flex flex-col items-center justify-center my-auto">
                      {/* Row 1: Dish Number Label (25px) */}
                      <div className="h-7 flex items-center justify-center w-full mb-1">
                        <span className="font-sans-clean text-[25px] font-bold uppercase tracking-wide text-slate-400 text-center block w-full leading-none">
                          Plat {index + 1}
                        </span>
                      </div>

                      {/* Row 2: Dish Name (Linéale Sans-Serif, #001489, Adaptive sizing, Never clipped) */}
                      <div className="min-h-[82px] max-h-[94px] flex items-center justify-center w-full text-center px-1 mb-1">
                        <h3
                          style={{ color: '#001489' }}
                          className={`font-sans-clean font-extrabold text-center w-full break-words tracking-tight ${getDishTitleClass(
                            dish.name
                          )}`}
                        >
                          {dish.name || 'Nom du plat à renseigner'}
                        </h3>
                      </div>

                      {/* Row 3: Dedicated Allergens Row (Strict horizontal alignment across all dishes) */}
                      <div className="h-[28px] flex items-center justify-center w-full text-center mb-1">
                        <AllergenBadge
                          allergens={dish.allergens}
                          customText={dish.customAllergenText}
                          size="md"
                          showLabel={true}
                          allergensList={allergensList}
                        />
                      </div>

                      {/* Row 4: Dedicated Badges Row (Single-line French Meat Badges VBF, VF, LPF) */}
                      <div className="h-[24px] flex items-center justify-center w-full text-center mb-1.5 overflow-visible">
                        <BadgesList
                          badges={dish.badges}
                          showFrenchMeat={dish.showFrenchMeat}
                          size="md"
                        />
                      </div>

                      {/* Row 5: Circular Cutout Plate Top View (Fixed Height, centered with deep 3D realistic depth) */}
                      <div className="h-[146px] flex items-center justify-center relative shrink-0 w-full">
                        {/* Layer 1: Ambient Contact Floor Shadow for dramatic depth */}
                        <div
                          style={{
                            width: `${plateSize - 8}px`,
                            height: `${plateSize - 8}px`,
                            background: 'radial-gradient(circle, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0) 75%)',
                          }}
                          className="absolute rounded-full blur-[8px] translate-y-3.5 pointer-events-none opacity-90"
                        />

                        {/* Layer 2: Elevated Porcelain Plate with multi-tier rich drop shadow and rim lighting */}
                        <div
                          style={{
                            width: `${plateSize}px`,
                            height: `${plateSize}px`,
                            minWidth: `${plateSize}px`,
                            minHeight: `${plateSize}px`,
                            boxShadow:
                              '0 20px 32px -4px rgba(0, 0, 0, 0.48), 0 10px 16px -2px rgba(0, 0, 0, 0.32), 0 3px 6px -1px rgba(0, 0, 0, 0.22), inset 0 2px 4px rgba(255, 255, 255, 0.75), inset 0 -2px 4px rgba(0, 0, 0, 0.20)',
                          }}
                          className="relative rounded-full overflow-hidden border-[3.5px] border-white ring-1 ring-black/15 bg-white flex items-center justify-center mx-auto transition-transform z-10"
                        >
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-2 text-slate-400">
                              <UtensilsCrossed
                                style={{ color: template.primaryColor }}
                                className="w-7 h-7 mb-1 opacity-40"
                              />
                              <span className="text-[10px] font-semibold text-slate-500">Assiette</span>
                            </div>
                          )}
                        </div>

                        {/* Subtle decorative ring accent matching template accent */}
                        <div
                          style={{
                            width: `${ringSize}px`,
                            height: `${ringSize}px`,
                            borderColor: `${template.accentColor}55`,
                          }}
                          className="absolute rounded-full border pointer-events-none z-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* 5. Footer Mention */}
          <footer
            style={{ borderColor: `${template.borderColor}15` }}
            className="relative z-10 pt-2 pb-0.5 px-4 flex items-center justify-center border-t"
          >
            <p className="font-serif-title italic text-xs text-slate-500 text-center tracking-wide">
              Photos non contractuelles
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};


