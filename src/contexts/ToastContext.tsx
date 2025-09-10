"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

type ToastKind = "loading" | "success" | "error";
type ToastItem = { id: number; title: string; description?: string; kind: ToastKind };

type ToastApi = {
  push: (t: Omit<ToastItem, "id">) => number;
  update: (id: number, t: Partial<Omit<ToastItem, "id">>) => void;
  remove: (id: number) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = idRef.current++;
    setToasts((arr) => [...arr, { id, ...t }]);
    return id;
  }, []);

  const update = useCallback((id: number, t: Partial<Omit<ToastItem, "id">>) => {
    setToasts((arr) => arr.map((x) => (x.id === id ? { ...x, ...t } : x)));
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((arr) => arr.filter((x) => x.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => ({ push, update, remove }), [push, update, remove]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Box position="fixed" top={4} right={4} zIndex={10000}>
        <Flex direction="column" gap={2}>
          {toasts.map((t) => (
            <Box key={t.id} bg={t.kind === "error" ? "red.100" : t.kind === "success" ? "green.100" : "gray.100"} borderWidth="1px" borderColor="gray.200" rounded="md" p={3} minW="260px">
              <Text fontWeight="semibold">{t.title}</Text>
              {t.description && <Text fontSize="sm" color="gray.600">{t.description}</Text>}
            </Box>
          ))}
        </Flex>
      </Box>
    </ToastCtx.Provider>
  );
}

export function useAppToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider not found");
  return ctx;
}


