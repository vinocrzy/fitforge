// ═══════════════════════════════════════════════════════════════════
// FitForge — Icon System
// SF Symbol keys → Phosphor Icons mapping (Architecture §2.9)
// ═══════════════════════════════════════════════════════════════════

import {
  House,
  ClipboardText,
  ClockCounterClockwise,
  UserCircle,
  PlusCircle,
  Play,
  CheckCircle,
  Timer,
  Scales,
  List,
  ListBullets,
  Trophy,
  CaretLeft,
  Flame,
  Lightning,
  X,
  Barbell,
  PersonSimpleRun,
  PersonSimpleWalk,
  FloppyDisk,
  DotsThreeVertical,
  ArrowClockwise,
  Pause,
  SkipForward,
  Gear,
  Heart,
  Star,
  ChartLineUp,
  CalendarBlank,
  Minus,
  Plus,
  MagnifyingGlass,
  Pencil,
  Trash,
  Copy,
  CaretRight,
  CaretUp,
  CaretDown,
  SlidersHorizontal,
  ArrowsDownUp,
  // Phase 7 — Cloud Sync
  Cloud,
  CloudCheck,
  CloudSlash,
  CloudWarning,
  ArrowsClockwise,
  DeviceMobile,
  Warning,
  WarningCircle,
  UserPlus,
  SignOut,
  ArrowCircleDown,
  Table,
  Bell,
  BellRinging,
  // Phase PT-2 — Trainer portal
  Briefcase,
  UsersThree,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

const ICON_MAP: Record<string, PhosphorIcon> = {
  'house.fill': House,
  'list.bullet.clipboard.fill': ClipboardText,
  'clock.arrow.circlepath': ClockCounterClockwise,
  'person.crop.circle.fill': UserCircle,
  'plus.circle.fill': PlusCircle,
  'play.fill': Play,
  'checkmark.circle.fill': CheckCircle,
  'timer': Timer,
  'scalemass.fill': Scales,
  'line.3.horizontal': List,
  'trophy.fill': Trophy,
  'chevron.left': CaretLeft,
  'flame.fill': Flame,
  'bolt.fill': Lightning,
  'xmark': X,
  'figure.strengthtraining.traditional': Barbell,
  'figure.run': PersonSimpleRun,
  'figure.flexibility': PersonSimpleWalk,
  'scale.3d': Scales,
  'square.and.arrow.down.fill': FloppyDisk,
  'ellipsis': DotsThreeVertical,
  'arrow.clockwise': ArrowClockwise,
  'pause.fill': Pause,
  'forward.fill': SkipForward,
  'gear': Gear,
  'heart.fill': Heart,
  'star.fill': Star,
  'chart.line.uptrend.xyaxis': ChartLineUp,
  'calendar': CalendarBlank,
  'list.bullet.rectangle': ListBullets,
  'minus': Minus,
  'plus': Plus,
  'magnifyingglass': MagnifyingGlass,
  'pencil': Pencil,
  'trash.fill': Trash,
  'doc.on.doc': Copy,
  'chevron.right': CaretRight,
  'chevron.up': CaretUp,
  'chevron.down': CaretDown,
  'slider.horizontal.3': SlidersHorizontal,
  'arrow.up.arrow.down': ArrowsDownUp,
  // Phase 7 — Cloud Sync icons
  'icloud': Cloud,
  'icloud.fill': Cloud,
  'checkmark.icloud.fill': CloudCheck,
  'icloud.slash.fill': CloudSlash,
  'exclamationmark.icloud.fill': CloudWarning,
  'arrow.triangle.2.circlepath': ArrowsClockwise,
  'iphone': DeviceMobile,
  'exclamationmark.triangle.fill': Warning,
  'exclamationmark.circle.fill': WarningCircle,
  'person.crop.circle.badge.plus': UserPlus,
  'rectangle.portrait.and.arrow.right': SignOut,
  'arrow.down.circle': ArrowCircleDown,
  'tablecells': Table,
  'bell.fill': Bell,
  'bell.badge.fill': BellRinging,
  // Phase PT-2 — Trainer portal
  'briefcase.fill': Briefcase,
  'person.3.fill': UsersThree,
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  weight = 'regular',
  className,
}: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }
  return (
    <Component
      size={size}
      color={color}
      weight={weight}
      className={className}
      aria-hidden
    />
  );
}
