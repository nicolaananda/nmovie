import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Extra classes for the sheet panel (e.g. max-height tweaks). */
  className?: string;
}

/**
 * Mobile-first bottom sheet. Slides up from the bottom on small screens
 * and falls back to a centered modal on larger screens.
 *
 * Closes on backdrop click and on Esc. Locks body scroll while open.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  className = '',
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9500] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`w-full md:max-w-md bg-[#1a1a1a] border-t md:border border-white/10 md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle (decorative on mobile) */}
        <div className="md:hidden flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3">{children}</div>
      </div>
    </div>
  );
}
