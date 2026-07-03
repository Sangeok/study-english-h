"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

type ToastOptions = {
  id?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const DEFAULT_DURATION = 3000;
const MAX_TOASTS = 3;

const VARIANT_STYLES: Record<ToastVariant, { icon: string; border: string; text: string; background: string }> = {
  info: {
    icon: "💡",
    border: "border-ocean",
    text: "text-ink",
    background: "bg-paper",
  },
  success: {
    icon: "✅",
    border: "border-teal",
    text: "text-ink",
    background: "bg-teal-tint",
  },
  warning: {
    icon: "⚠️",
    border: "border-gold",
    text: "text-ink",
    background: "bg-gold-tint",
  },
  error: {
    icon: "⛔",
    border: "border-coral",
    text: "text-ink",
    background: "bg-coral-tint",
  },
};

const ToastContext = createContext<ToastContextValue | null>(null);

const createToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;

      const existing = timersRef.current.get(id);
      if (existing) {
        clearTimeout(existing);
      }

      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [dismiss]
  );

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = options?.id ?? createToastId();
      const variant = options?.variant ?? "info";
      const duration = options?.duration ?? DEFAULT_DURATION;

      setToasts((prev) => {
        const filtered = prev.filter((toastItem) => toastItem.id !== id);
        const next = [...filtered, { id, message, variant, duration }];

        if (next.length > MAX_TOASTS) {
          const overflow = next.slice(0, next.length - MAX_TOASTS);
          overflow.forEach((toastItem) => {
            const timer = timersRef.current.get(toastItem.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(toastItem.id);
            }
          });
          return next.slice(-MAX_TOASTS);
        }

        return next;
      });

      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      clear,
    }),
    [toast, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0 pointer-events-none"
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styles = VARIANT_STYLES[toast.variant];
        return (
          <div key={toast.id} className="pointer-events-auto">
            <div
              role="status"
              className={`flex items-start gap-3 rounded-2xl border-2 ${styles.border} ${styles.background} px-4 py-3 text-sm ${styles.text} animate-fade-in`}
              style={{ boxShadow: "0 4px 0 0 var(--border-warm), 0 16px 28px -18px rgba(34,50,79,.5)" }}
            >
              <span className="text-lg">{styles.icon}</span>
              <p className="flex-1 font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-ink-soft hover:text-ink transition-colors"
                aria-label="알림 닫기"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
