'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const TOAST_DURATION_MS = 2600;

/** Provedor do toast escuro (canto inferior direito, 2,6 s). */
export function ToastProvider({
  children,
  duration = TOAST_DURATION_MS,
}: {
  children: ReactNode;
  duration?: number;
}) {
  const [message, setMessage] = useState('');
  const [seq, setSeq] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (m: string) => {
      setMessage(m);
      setSeq((n) => n + 1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-6 bottom-6 z-50"
      >
        {message ? (
          <div
            key={seq}
            className="bg-ink text-bg animate-ceak-toast rounded-input shadow-dropdown px-[18px] py-3 text-sm"
          >
            {message}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return ctx;
}
