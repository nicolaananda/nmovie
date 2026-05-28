import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PromptOptions {
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'border-green-500/40 bg-green-500/10 text-green-100',
    icon: <CheckCircle2 size={18} className="text-green-400" />,
  },
  error: {
    ring: 'border-red-500/40 bg-red-500/10 text-red-100',
    icon: <AlertCircle size={18} className="text-red-400" />,
  },
  info: {
    ring: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
    icon: <Info size={18} className="text-sky-400" />,
  },
  warning: {
    ring: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    icon: <AlertTriangle size={18} className="text-amber-400" />,
  },
};

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface PromptState extends PromptOptions {
  resolve: (value: string | null) => void;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id = ++idRef.current;
      const variant = opts?.variant ?? 'info';
      const duration = opts?.duration ?? 4000;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const success = useCallback((message: string, duration?: number) => toast(message, { variant: 'success', duration }), [toast]);
  const error = useCallback((message: string, duration?: number) => toast(message, { variant: 'error', duration }), [toast]);
  const info = useCallback((message: string, duration?: number) => toast(message, { variant: 'info', duration }), [toast]);
  const warning = useCallback((message: string, duration?: number) => toast(message, { variant: 'warning', duration }), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.defaultValue ?? '');
      setPromptState({ ...options, resolve });
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const closePrompt = (result: string | null) => {
    promptState?.resolve(result);
    setPromptState(null);
    setPromptValue('');
  };

  // Esc closes any open dialog
  useEffect(() => {
    if (!confirmState && !promptState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState) closeConfirm(false);
        if (promptState) closePrompt(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState, promptState]);

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, info, warning, confirm, prompt }),
    [toast, success, error, info, warning, confirm, prompt],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg min-w-[280px] max-w-md animate-slide-up ${VARIANT_STYLES[t.variant].ring}`}
          >
            <span className="mt-0.5 shrink-0">{VARIANT_STYLES[t.variant].icon}</span>
            <span className="text-sm flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmState.title && (
              <h3 className="text-white font-semibold text-lg mb-2">{confirmState.title}</h3>
            )}
            <p className="text-gray-300 text-sm mb-5 whitespace-pre-line">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
              >
                {confirmState.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                autoFocus
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  confirmState.destructive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {confirmState.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt modal */}
      {promptState && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => closePrompt(null)}
        >
          <form
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              closePrompt(promptValue);
            }}
          >
            {promptState.title && (
              <h3 className="text-white font-semibold text-lg mb-2">{promptState.title}</h3>
            )}
            <p className="text-gray-300 text-sm mb-3">{promptState.message}</p>
            <input
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState.placeholder}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => closePrompt(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
              >
                {promptState.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white"
              >
                {promptState.confirmLabel ?? 'OK'}
              </button>
            </div>
          </form>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
