"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Flex, Text, HStack, VStack, Heading,
  useDisclosure, // Hook quản lý trạng thái mở/đóng
  IconButton,
  Image, // Để hiển thị logo connector
} from "@chakra-ui/react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAccount, useBalance, useConnect, useDisconnect, useEnsName } from "wagmi";

function truncateAddress(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// Component con cho từng hàng thông tin trong popover
function InfoRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <Flex w="full" justify="space-between" align="center">
      <Text fontSize="sm" color="whiteAlpha.600">{label}</Text>
      <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.800">{value}</Text>
    </Flex>
  );
}

export function ConnectWalletButton() {
  const account = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address: account.address });
  const { data: nativeBalance } = useBalance({ address: account.address });
  
  // Sử dụng useDisclosure cho trạng thái mở/đóng của popover
  const { open, onToggle, onClose } = useDisclosure();

  // Logic sao chép địa chỉ (tự triển khai thay vì useClipboard)
  const [hasCopied, setHasCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(account.address ?? "");
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1500);
    } catch {}
  }

  const label = useMemo(() => ensName || truncateAddress(account.address), [ensName, account.address]);

  // Đóng popover khi người dùng kết nối/ngắt kết nối
  useEffect(() => {
    onClose();
  }, [account.isConnected, onClose]);
  
  // Nút khi đã kết nối
  if (account.isConnected) {
    const chainName = account.chain?.name ?? "Unknown Network";
    const bal = nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : "-";

    return (
      <Box position="relative">
        <Button
          onClick={onToggle}
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.08)"
          _hover={{ bg: "rgba(23, 35, 53, 0.8)", borderColor: "rgba(255,255,255,0.15)" }}
          _active={{ bg: "rgba(15, 25, 40, 0.85)" }}
          h="40px"
          px={4}
          minW="220px"
          rounded="lg"
        >
          <Flex position="relative" align="center" justify="center" w="full">
            {/* Avatar giữ bên trái, địa chỉ vẫn được căn giữa tuyệt đối */}
            <Box position="absolute" left={3} boxSize="24px" rounded="full" bgGradient="linear(to-tr, brand.400, #00FFC2)" />
            <Text fontWeight="bold" color="white" textAlign="center" letterSpacing="wider">
              {label}
            </Text>
          </Flex>
        </Button>

        {open && (
          <VStack
            position="absolute"
            right={0}
            mt={2}
            w="300px"
            p={4}
            gap={3}
            align="stretch"
            bg="rgba(23, 35, 53, 0.75)"
            backdropFilter="blur(15px)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            rounded="xl"
            boxShadow="0 10px 30px rgba(0,0,0,0.3)"
            zIndex={10}
          >
            <Flex align="center" justify="center" position="relative">
              <Text fontSize="md" fontWeight="extrabold" color="whiteAlpha.900" textAlign="center" letterSpacing="wider">
                {label}
              </Text>
              <IconButton
                aria-label="Copy address"
                onClick={onCopy}
                size="sm"
                variant="ghost"
                color="whiteAlpha.700"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                position="absolute"
                right={0}
              >
                {hasCopied ? <Box as={FiCheck} color="green.400" /> : <Box as={FiCopy} />}
              </IconButton>
            </Flex>
            <Box h="1px" bg="whiteAlpha.200" />
            <InfoRow label="Network" value={chainName} />
            <InfoRow label="Balance" value={`${bal} ${nativeBalance?.symbol}`} />
            <InfoRow label="Wallet" value={account.connector?.name} />
            <Box h="1px" bg="whiteAlpha.200" />
            <GradientButton onClick={() => disconnect()}>Disconnect</GradientButton>
          </VStack>
        )}
      </Box>
    );
  }

  // Nút khi chưa kết nối
  return (
    <Box position="relative">
      <GradientButton onClick={onToggle} loading={isPending} h="40px" px={5}>
        Connect Wallet
      </GradientButton>

      {open && (
        <VStack
          position="absolute"
          right={0}
          mt={2}
          w="300px"
          p={4}
          gap={3}
          align="stretch"
          bg="rgba(23, 35, 53, 0.75)"
          backdropFilter="blur(15px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          rounded="xl"
          boxShadow="0 10px 30px rgba(0,0,0,0.3)"
          zIndex={10}
        >
          <Heading size="sm" color="whiteAlpha.800">Connect a Wallet</Heading>
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => connect({ connector })}
              justifyContent="flex-start"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.100' }}
              size="lg"
            >
              <HStack gap={3}>
                <Image src={(connector as unknown as { icon?: string }).icon} alt={connector.name} boxSize="24px" />
                <Text>{connector.name}</Text>
              </HStack>
            </Button>
          ))}
        </VStack>
      )}
    </Box>
  );
}