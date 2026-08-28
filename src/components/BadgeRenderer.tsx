import React from 'react';
import { ChefHat, Leaf, Sprout, Fish, Award, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { DEFAULT_BADGES } from '../data/badges';
import { DishBadge } from '../types';

interface BadgeRendererProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customBadgesList?: DishBadge[];
}

export const BadgeRenderer: React.FC<BadgeRendererProps> = ({
  badgeId,
  size = 'md',
  className = '',
  customBadgesList = [],
}) => {
  // Normalize legacy ID 'viande-francaise' to 'vf'
  const normalizedId = badgeId === 'viande-francaise' ? 'vf' : badgeId;
  const allBadges = [...DEFAULT_BADGES, ...customBadgesList];
  const badge = allBadges.find((b) => b.id === normalizedId) || {
    id: badgeId,
    label: badgeId.toUpperCase(),
    fullName: badgeId,
    type: 'flag-fr',
    bgClass: 'bg-white text-slate-900 border-slate-200',
  };

  const sizeClasses = {
    sm: 'h-[18px] px-1.5 text-[9px] gap-1',
    md: 'h-[20px] px-2 text-[10px] gap-1.2',
    lg: 'h-[24px] px-2.5 text-xs gap-1.5',
  };

  const flagSizes = {
    sm: 'w-2.5 h-3',
    md: 'w-3 h-3.5',
    lg: 'w-3.5 h-4',
  };

  return (
    <div
      className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-white border border-slate-300/90 shadow-2xs rounded-md font-bold text-slate-900 tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
      title={badge.fullName || badge.label}
    >
      {/* Tricolore French Flag */}
      <div className={`relative flex overflow-hidden rounded-[1.5px] shadow-2xs border border-slate-300/80 shrink-0 ${flagSizes[size]}`}>
        <div className="w-1/3 h-full bg-[#002654]" />
        <div className="w-1/3 h-full bg-white" />
        <div className="w-1/3 h-full bg-[#ED2939]" />
      </div>

      <span className="font-sans-clean font-extrabold tracking-tight text-slate-900 whitespace-nowrap leading-none">
        {badge.label}
      </span>
    </div>
  );
};

interface BadgesListProps {
  badges?: string[];
  showFrenchMeat?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customBadgesList?: DishBadge[];
}

export const BadgesList: React.FC<BadgesListProps> = ({
  badges = [],
  showFrenchMeat = false,
  size = 'md',
  className = '',
  customBadgesList = [],
}) => {
  // Use explicitly selected badges from the dish
  let effectiveBadges: string[] = [];

  if (Array.isArray(badges) && badges.length > 0) {
    effectiveBadges = badges.map((id) => (id === 'viande-francaise' ? 'vf' : id));
  } else if (showFrenchMeat) {
    // Only use legacy fallback if badges array is empty or undefined
    effectiveBadges = ['vf'];
  }

  // Deduplicate while preserving user selection order
  const uniqueBadges = Array.from(new Set(effectiveBadges));

  if (uniqueBadges.length === 0) {
    return <div className="h-[20px]" />;
  }

  return (
    <div className={`flex flex-row items-center justify-center flex-nowrap gap-1.5 whitespace-nowrap overflow-visible ${className}`}>
      {uniqueBadges.map((badgeId) => (
        <BadgeRenderer
          key={badgeId}
          badgeId={badgeId}
          size={size}
          customBadgesList={customBadgesList}
        />
      ))}
    </div>
  );
};
