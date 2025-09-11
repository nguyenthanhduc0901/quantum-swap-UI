"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, Text, HStack } from "@chakra-ui/react";
import { useAccount, useBalance, useConnect, useDisconnect, useEnsName } from "wagmi";

function truncateAddress(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function ConnectWalletButton() {
  const account = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address: account.address });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: nativeBalance } = useBalance({ address: account.address, query: { enabled: Boolean(account.address) } });

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = useMemo(() => ensName || truncateAddress(account.address), [ensName, account.address]);

  if (account.isConnected) {
    const chainName = account.chain?.name ?? "Unknown";
    const bal = nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : "-";

    return (
      <Box position="relative">
        <Button onClick={() => setOpen((v) => !v)} variant="outline" colorScheme="brand" _hover={{ bg: "gray.100" }} h={9} px={3}>
          <HStack gap={2} align="center">
            <Box as="span" px={2} h={5} display="inline-flex" alignItems="center" rounded="md" bg="gray.100" color="fg" fontSize="xs">
              {chainName}
            </Box>
            <Text>{bal} {nativeBalance?.symbol ?? "ETH"}</Text>
            <Text fontWeight="semibold">{label}</Text>
          </HStack>
        </Button>
        {open && (
          <Box position="absolute" right={0} mt={2} bg="panelBg" borderWidth="1px" borderColor="panelBorder" rounded="md" shadow="md" w="280px" p={3} zIndex={10}>
            <Flex direction="column" align="stretch" gap={2}>
              <Text fontSize="sm" color="gray.400">{account.address}</Text>
              <Text fontSize="sm" color="gray.400">Wallet: {account.connector?.name ?? "Unknown"}</Text>
              <HStack justify="flex-end" pt={2}>
                <Button size="sm" onClick={() => { setOpen(false); disconnect(); }}>
                  Disconnect
                </Button>
              </HStack>
            </Flex>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box position="relative">
      <Button colorScheme="brand" onClick={() => setOpen((v) => !v)} loading={isPending} h={9} px={3}>
        Connect Wallet
      </Button>
      {open && mounted && (
        <Box position="absolute" right={0} mt={2} bg="panelBg" borderWidth="1px" borderColor="panelBorder" rounded="md" shadow="md" w="260px" p={3} zIndex={10}>
          <Flex direction="column" align="stretch" gap={3}>
            {connectors.map((connector) => {
              const supported = typeof window !== "undefined" && "ethereum" in window;
              return (
                <Button
                  key={connector.uid}
                  onClick={async () => {
                    await connect({ connector });
                    setOpen(false);
                  }}
                  disabled={!supported}
                >
                  {connector.name}
                  {!supported && <Text as="span" ml={2} color="gray.500">(unsupported)</Text>}
                </Button>
              );
            })}
          </Flex>
        </Box>
      )}
    </Box>
  );
}


