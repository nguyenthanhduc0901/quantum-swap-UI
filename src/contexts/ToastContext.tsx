"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { VStack } from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import { CustomToast, type ToastKind } from "@/components/ui/CustomToast";

type ToastMessage = {
  id: number;
  title: string;
  description?: React.ReactNode;
  kind: ToastKind;
};

type ToastContextType = {
  push: (options: Omit<ToastMessage, "id"> & { duration?: number | null }) => number;
  update: (id: number, options: Partial<Omit<ToastMessage, "id">>) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const push = useCallback((options: Omit<ToastMessage, "id"> & { duration?: number | null }) => {
    const id = Date.now();
    const duration = options.duration === null ? null : options.duration ?? 5000;
    setToasts((prev) => [...prev, { id, ...options }]);
    if (duration !== null) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, []);

  const update = useCallback((id: number, options: Partial<Omit<ToastMessage, "id">>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...options } : t)));
  }, []);

  return (
    <ToastContext.Provider value={{ push, update }}>
      {children}
      <VStack spacing={3} position="fixed" bottom={4} right={4} zIndex={10000} align="flex-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <CustomToast key={toast.id} {...toast} />
          ))}
        </AnimatePresence>
      </VStack>
    </ToastContext.Provider>
  );
};

export const useAppToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within a ToastProvider");
  }
  return context;
};




