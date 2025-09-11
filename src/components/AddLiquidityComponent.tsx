"use client";
import { useMemo, useState } from "react";
import { Box, Button, Flex, HStack, Heading, Input, Text } from "@chakra-ui/react";
import { useChainId } from "wagmi";
import { TokenSelectModal } from "@/components/ui/TokenSelectModal";
import { getDefaultTokens, type TokenInfo } from "@/constants/tokens";

export function AddLiquidityComponent() {
  const chainId = useChainId() ?? 31337;
  const defaults = useMemo(() => getDefaultTokens(chainId), [chainId]);
  const [tokenA, setTokenA] = useState<TokenInfo | null>(defaults[0] ?? null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(defaults[1] ?? null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selecting, setSelecting] = useState<"A" | "B" | null>(null);

  const canSubmit = Boolean(tokenA && tokenB && amountA && amountB);

  return (
    <Box w={{ base: "100%", md: "520px" }} borderWidth="1px" borderColor="cardBorder" rounded="xl" p={6} bg="cardBg" boxShadow="card">
      <Flex direction="column" align="stretch" gap={4}>
        <Heading size="lg" mb={1} fontWeight="semibold">Add Liquidity</Heading>

        <Flex direction="column" gap={2}>
          <Text fontSize="sm" color="gray.600">Token A</Text>
          <HStack>
            <Button variant="outline" onClick={() => setSelecting("A")}>{tokenA?.symbol ?? "Select"}</Button>
            <Input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} />
          </HStack>
        </Flex>

        <Flex direction="column" gap={2}>
          <Text fontSize="sm" color="gray.600">Token B</Text>
          <HStack>
            <Button variant="outline" onClick={() => setSelecting("B")}>{tokenB?.symbol ?? "Select"}</Button>
            <Input type="number" placeholder="0.0" value={amountB} onChange={(e) => setAmountB(e.target.value)} />
          </HStack>
        </Flex>

        <Button colorScheme="brand" disabled={!canSubmit} _disabled={{ opacity: 0.6, cursor: "not-allowed" }} height="44px" rounded="md" fontWeight="semibold">Add Liquidity</Button>
      </Flex>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => (selecting === "A" ? setTokenA(t) : setTokenB(t))}
      />
    </Box>
  );
}


