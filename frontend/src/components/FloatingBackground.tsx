import { StickyNote, BookOpen, Smile, File, FileText, Pencil } from 'lucide-react';

interface FloatingIconSpec {
  Icon: typeof StickyNote;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
  // Only shown from this breakpoint down to the next tier below, so the
  // count grows on larger screens without any JS-based viewport detection.
  minTier: 'mobile' | 'tablet' | 'desktop';
}

const TIER_CLASS: Record<FloatingIconSpec['minTier'], string> = {
  mobile: '',
  tablet: 'hidden sm:block',
  desktop: 'hidden lg:block',
};

// Positions/sizes are hand-placed to sit in empty margins around the centered
// app content (max-w-6xl) rather than on top of it. Durations/delays/drift
// are all different so the icons don't move in visible unison.
const ICONS: FloatingIconSpec[] = [
  { Icon: StickyNote, top: '8%', left: '4%', size: 32, duration: 9, delay: 0, drift: 20, rotate: 6, minTier: 'mobile' },
  { Icon: FileText, top: '22%', left: '90%', size: 28, duration: 11, delay: 1.2, drift: 15, rotate: -5, minTier: 'mobile' },
  { Icon: BookOpen, top: '45%', left: '2%', size: 30, duration: 13, delay: 0.6, drift: 25, rotate: 4, minTier: 'mobile' },
  { Icon: Pencil, top: '68%', left: '93%', size: 26, duration: 10, delay: 2, drift: 18, rotate: -6, minTier: 'mobile' },
  { Icon: File, top: '85%', left: '6%', size: 30, duration: 12, delay: 0.4, drift: 22, rotate: 5, minTier: 'mobile' },
  { Icon: Smile, top: '5%', left: '80%', size: 26, duration: 8, delay: 1.6, drift: 16, rotate: -4, minTier: 'mobile' },

  { Icon: File, top: '35%', left: '95%', size: 24, duration: 14, delay: 0.8, drift: 14, rotate: 3, minTier: 'tablet' },
  { Icon: Smile, top: '58%', left: '3%', size: 22, duration: 9.5, delay: 1.4, drift: 20, rotate: -3, minTier: 'tablet' },
  { Icon: Pencil, top: '92%', left: '85%', size: 24, duration: 11.5, delay: 0.2, drift: 17, rotate: 5, minTier: 'tablet' },
  { Icon: StickyNote, top: '15%', left: '55%', size: 24, duration: 13.5, delay: 2.4, drift: 19, rotate: -5, minTier: 'tablet' },

  { Icon: BookOpen, top: '75%', left: '45%', size: 22, duration: 10.5, delay: 1.8, drift: 15, rotate: 4, minTier: 'desktop' },
  { Icon: FileText, top: '3%', left: '35%', size: 20, duration: 12.5, delay: 0.3, drift: 12, rotate: -4, minTier: 'desktop' },
  { Icon: File, top: '50%', left: '25%', size: 20, duration: 9, delay: 2.2, drift: 14, rotate: 3, minTier: 'desktop' },
  { Icon: Smile, top: '95%', left: '65%', size: 22, duration: 14.5, delay: 1, drift: 18, rotate: -3, minTier: 'desktop' },
  { Icon: Pencil, top: '28%', left: '15%', size: 20, duration: 11, delay: 0.5, drift: 13, rotate: 5, minTier: 'desktop' },
];

export function FloatingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {ICONS.map(({ Icon, top, left, size, duration, delay, drift, rotate }, i) => (
        <Icon
          key={i}
          size={size}
          className={`floating-icon absolute text-brand-500 opacity-[0.12] dark:text-brand-400 dark:opacity-[0.14] ${TIER_CLASS[ICONS[i].minTier]}`}
          style={{
            top,
            left,
            // Custom properties consumed by the .floating-icon keyframes so
            // each icon gets its own distance/rotation without a unique
            // @keyframes block per icon.
            ['--float-drift' as string]: `${drift}px`,
            ['--float-rotate' as string]: `${rotate}deg`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}
