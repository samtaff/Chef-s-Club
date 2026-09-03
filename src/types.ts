export type DayId = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type MenuTemplateId = 'classic-navy' | 'bistro-slate' | 'emerald-luxury' | 'terracotta-sun' | 'modern-noir';

export interface DishBadge {
  id: string;
  label: string;
  fullName?: string;
  type?: 'flag-fr' | 'chef-hat' | 'leaf' | 'sprout' | 'fish' | 'award' | 'map-pin' | 'shield' | 'custom';
  bgClass?: string;
  isCustom?: boolean;
}

export interface Dish {
  id: string;
  name: string;
  allergens: number[]; // Numbers 1 to 14 or custom numbers
  customAllergenText?: string;
  showFrenchMeat: boolean;
  badges?: string[]; // Array of badge IDs or custom badge labels
  imageUrl: string;
}

export interface DayMenu {
  id: DayId;
  dayName: string; // "Lundi", "Mardi", etc.
  dateFormatted: string; // "31/08" or "01 Septembre"
  dishCount: 2 | 3;
  dishes: Dish[];
  backgroundId: string;
  customBackgroundUrl?: string;
  isHoliday?: boolean;
  holidayText?: string;
  holidaySubtext?: string;
}

export interface CoverPageData {
  id: 'cover';
  brandName: string;
  title: string;
  subtitlePrefix: string;
  startDate: string;
  subtitleMiddle: string;
  endDate: string;
  year: string;
  tagline: string;
  backgroundId: string;
  customBackgroundUrl?: string;
  featuredPhotos: string[];
}

export interface WeeklyMenuData {
  id: string;
  weekLabel: string;
  templateId?: MenuTemplateId;
  cover: CoverPageData;
  days: {
    monday: DayMenu;
    tuesday: DayMenu;
    wednesday: DayMenu;
    thursday: DayMenu;
    friday: DayMenu;
  };
}

export interface BackgroundItem {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export type PhotoCategory = 'viande' | 'poisson' | 'vegetarien' | 'plat' | 'dessert' | 'entree' | 'autre';

export interface PhotoLibraryItem {
  id: string;
  name: string;
  category: PhotoCategory;
  url: string;
  originalUrl?: string;
  isCustom?: boolean;
  createdAt: number;
}

export interface AllergenDef {
  number: number;
  name: string;
  shortName: string;
  color?: string;
  textColor?: string;
  bgHex: string;
  isCustom?: boolean;
}

export interface MenuTemplateConfig {
  id: MenuTemplateId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  cardBgGradient: string;
  borderColor: string;
  titleColor: string;
  crestBg: string;
  crestIconColor: string;
  swatchGradient: string;
}

