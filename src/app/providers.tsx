"use client";

import { ReactNode, useState } from "react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import system from "../styles/theme";
import { ToastProvider } from "../contexts/ToastContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "@wagmi/connectors";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, hardhat],
  connectors: [
    injected({ shimDisconnect: true }), // Enable MetaMask and other injected wallets
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  }));

  // Persist query cache between reloads (client-only)
  if (typeof window !== "undefined") {
    const persister = createSyncStoragePersister({ storage: window.localStorage });
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });
  }

  return (
    <ChakraProvider value={system ?? (defaultSystem as any)}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </ToastProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ChakraProvider>
  );
}


