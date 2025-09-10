"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, Text, HStack } from "@chakra-ui/react";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = useMemo(() => ensName || truncateAddress(account.address), [ensName, account.address]);

  if (account.isConnected) {
    return (
      <Box position="relative">
        <Button colorScheme="teal" onClick={() => setOpen((v) => !v)}>
          {label}
        </Button>
        {open && (
          <Box position="absolute" right={0} mt={2} bg="white" borderWidth="1px" borderColor="gray.200" rounded="md" shadow="md" w="260px" p={3} zIndex={10}>
            <Flex direction="column" align="stretch" gap={2}>
              <Text fontSize="sm" color="gray.600" truncate>
                {account.address}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Wallet: {account.connector?.name ?? "Unknown"}
              </Text>
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
      <Button colorScheme="teal" onClick={() => setOpen((v) => !v)} loading={isPending}>
        Connect Wallet
      </Button>
      {open && mounted && (
        <Box position="absolute" right={0} mt={2} bg="white" borderWidth="1px" borderColor="gray.200" rounded="md" shadow="md" w="260px" p={3} zIndex={10}>
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


