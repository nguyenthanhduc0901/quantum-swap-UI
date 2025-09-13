"use client";
import { useMemo, useState, useEffect } from "react";
import { Box, Button, Flex, HStack, Heading, Image, Input, Text } from "@chakra-ui/react";
import { FaEthereum, FaCoins } from "react-icons/fa";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi } from "viem";
import { TokenSelectModal } from "@/components/ui/TokenSelectModal";
import { getDefaultTokens, type TokenInfo } from "@/constants/tokens";
import { useLiquidityCalculations } from "@/hooks/useLiquidityCalculations";
import { getContracts, type QuantumSwapAddresses } from "@/constants/addresses";
import routerAbi from "@/constants/abi/QuantumSwapRouter.json";
import pairAbi from "@/constants/abi/QuantumSwapPair.json"; // ERC20 subset
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { Balance } from "@/components/ui/Balance";

export function AddLiquidityComponent() {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const defaults = useMemo(() => getDefaultTokens(chainId), [chainId]);
  const [tokenA, setTokenA] = useState<TokenInfo | null>(defaults[0] ?? null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(defaults[1] ?? null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selecting, setSelecting] = useState<"A" | "B" | null>(null);

  const { pairAddress, pairExists, reserves, estimatedAmountA, estimatedAmountB, priceAB, shareOfPool } = useLiquidityCalculations({ tokenA, tokenB, amountA, amountB });

  const sameToken = useMemo(() => {
    if (!tokenA || !tokenB) return false;
    return tokenA.address.toLowerCase() === tokenB.address.toLowerCase();
  }, [tokenA?.address, tokenB?.address]);

  // Two-way auto-fill: when typing one, fill the other
  useEffect(() => {
    if (estimatedAmountB && Number(amountA) > 0 && (Number(amountB) === 0 || selecting === "A")) {
      setAmountB(estimatedAmountB);
    }
  }, [estimatedAmountB]);
  useEffect(() => {
    if (estimatedAmountA && Number(amountB) > 0 && (Number(amountA) === 0 || selecting === "B")) {
      setAmountA(estimatedAmountA);
    }
  }, [estimatedAmountA]);

  // Allowance checks
  const allowanceA = useReadContract({
    address: (tokenA?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: pairAbi.abi as Abi,
    functionName: "allowance",
    args: account.address && tokenA ? [account.address, router] : undefined,
    query: { enabled: Boolean(account.address && tokenA) },
  });
  const allowanceB = useReadContract({
    address: (tokenB?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: pairAbi.abi as Abi,
    functionName: "allowance",
    args: account.address && tokenB ? [account.address, router] : undefined,
    query: { enabled: Boolean(account.address && tokenB) },
  });

  const amountAWei = tokenA ? BigInt(Math.floor(Number(amountA || "0") * 10 ** (tokenA.decimals || 18))) : 0n;
  const amountBWei = tokenB ? BigInt(Math.floor(Number(amountB || "0") * 10 ** (tokenB.decimals || 18))) : 0n;

  const needsApproveA = useMemo(() => {
    try {
      return tokenA && allowanceA.data ? ((allowanceA.data as unknown as bigint) < amountAWei) : false;
    } catch { return false; }
  }, [allowanceA.data, tokenA, amountAWei]);

  const needsApproveB = useMemo(() => {
    try {
      return tokenB && allowanceB.data ? ((allowanceB.data as unknown as bigint) < amountBWei) : false;
    } catch { return false; }
  }, [allowanceB.data, tokenB, amountBWei]);

  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });
  useTransactionStatus({
    isPending: !!txHash && receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
    error: receipt.error,
    hash: txHash as string,
  });

  const [step, setStep] = useState<"approveA" | "approveB" | "supply">("approveA");
  useEffect(() => {
    if (!needsApproveA) {
      setStep(needsApproveB ? "approveB" : "supply");
    } else {
      setStep("approveA");
    }
  }, [needsApproveA, needsApproveB]);

  async function onApproveA() {
    if (!tokenA) return;
    const hash = await writeContractAsync({
      address: tokenA.address,
      abi: pairAbi.abi as Abi,
      functionName: "approve",
      args: [router, BigInt(2) ** BigInt(256) - BigInt(1)],
    });
    setTxHash(hash as `0x${string}`);
  }
  async function onApproveB() {
    if (!tokenB) return;
    const hash = await writeContractAsync({
      address: tokenB.address,
      abi: pairAbi.abi as Abi,
      functionName: "approve",
      args: [router, BigInt(2) ** BigInt(256) - BigInt(1)],
    });
    setTxHash(hash as `0x${string}`);
  }

  async function onSupply() {
    if (!tokenA || !tokenB) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
    const hash = await writeContractAsync({
      address: router,
      abi: routerAbi.abi as Abi,
      functionName: "addLiquidity",
      args: [
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        0n, // amountAMin
        0n, // amountBMin
        account.address!,
        deadline,
      ],
    });
    setTxHash(hash as `0x${string}`);
  }

  const mainCta = useMemo(() => {
    if (!account.isConnected) return { label: "Connect Wallet", action: undefined };
    if (sameToken) return { label: "Select different tokens", action: undefined };
    if (!tokenA || !tokenB || !(Number(amountA) > 0 && Number(amountB) > 0)) return { label: "Enter amounts", action: undefined };
    if (step === "approveA") return { label: `Approve ${tokenA.symbol}`, action: onApproveA };
    if (step === "approveB") return { label: `Approve ${tokenB.symbol}`, action: onApproveB };
    return { label: "Supply", action: onSupply };
  }, [account.isConnected, tokenA, tokenB, amountA, amountB, step, sameToken]);

  const canSubmit = Boolean(tokenA && tokenB && amountA && amountB);

  function getIconForSymbol(symbol?: string) {
    const s = symbol?.toUpperCase();
    if (s === "ETH" || s === "WETH") return FaEthereum;
    return FaCoins;
  }

  return (
    <Box w={{ base: "100%", md: "520px" }} borderWidth="1px" borderColor="cardBorder" rounded="xl" p={6} bg="cardBg" boxShadow="card">
      <Flex direction="column" align="stretch" gap={4}>
        <Heading size="lg" mb={1} fontWeight="semibold">Add Liquidity</Heading>

        <Flex direction="column" gap={2}>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600">Token A</Text>
            {tokenA && (<Balance key={`${tokenA.address}-${Number(txHash || 0)}`} tokenAddress={tokenA.address} />)}
          </Flex>
          <HStack>
            <Button variant="outline" onClick={() => setSelecting("A")}>
              <Flex align="center" gap={2}>
                {tokenA?.logoURI ? (
                  <Image src={tokenA.logoURI} alt={tokenA.symbol} boxSize="18px" rounded="full" />
                ) : (
                  <Box as={getIconForSymbol(tokenA?.symbol)} boxSize="18px" />
                )}
                <Text fontWeight="semibold">{tokenA?.symbol ?? "Select"}</Text>
              </Flex>
            </Button>
            <Input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} />
          </HStack>
        </Flex>

        <Flex direction="column" gap={2}>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600">Token B</Text>
            {tokenB && (<Balance key={`${tokenB.address}-${Number(txHash || 0)}`} tokenAddress={tokenB.address} />)}
          </Flex>
          <HStack>
            <Button variant="outline" onClick={() => setSelecting("B")}>
              <Flex align="center" gap={2}>
                {tokenB?.logoURI ? (
                  <Image src={tokenB.logoURI} alt={tokenB.symbol} boxSize="18px" rounded="full" />
                ) : (
                  <Box as={getIconForSymbol(tokenB?.symbol)} boxSize="18px" />
                )}
                <Text fontWeight="semibold">{tokenB?.symbol ?? "Select"}</Text>
              </Flex>
            </Button>
            <Input type="number" placeholder="0.0" value={amountB} onChange={(e) => setAmountB(e.target.value)} />
          </HStack>
        </Flex>

        {/* Derived info */}
        <Box fontSize="sm" color="gray.500">
          {!sameToken && priceAB && tokenA && tokenB && (
            <Text>Price: 1 {tokenA.symbol} ≈ {priceAB.toFixed(6)} {tokenB.symbol}</Text>
          )}
          {typeof shareOfPool === "number" && (
            <Text>Share of Pool: {shareOfPool.toFixed(4)}%</Text>
          )}
        </Box>

        <Button 
          colorScheme="brand" 
          disabled={!canSubmit || !mainCta.action} 
          onClick={() => mainCta.action?.()} 
          _disabled={{ opacity: 0.6, cursor: "not-allowed" }} 
          height="44px" 
          rounded="md" 
          fontWeight="semibold"
        >
          {mainCta.label}
        </Button>
      </Flex>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => (selecting === "A" ? setTokenA(t) : setTokenB(t))}
      />
    </Box>
  );
}


