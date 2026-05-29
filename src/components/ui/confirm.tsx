'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export const useConfirm = () => useContext(ConfirmContext);

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-dark-surface border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${state.variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                  <AlertTriangle className={`w-5 h-5 ${state.variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{state.title || 'Confirm Action'}</h3>
                  <p className="text-sm text-gray-400 mt-1">{state.message}</p>
                </div>
                <button onClick={() => handleConfirm(false)} className="text-gray-500 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-5 justify-end">
                <button onClick={() => handleConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-400 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-colors">
                  {state.cancelText || 'Cancel'}
                </button>
                <button onClick={() => handleConfirm(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    state.variant === 'danger'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}>
                  {state.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}