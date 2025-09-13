"use client";

import { useMemo, useState, useEffect } from "react";
import { Box, Flex, HStack, Heading, Button, Text, IconButton } from "@chakra-ui/react";
import { FiArrowDown } from "react-icons/fi";
import { TokenInfo, getDefaultTokens } from "../constants/tokens";
import { TokenSelectModal } from "./ui/TokenSelectModal";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useBlockNumber } from "wagmi";
import { type Abi, formatUnits, parseUnits } from "viem";
import routerAbi from "../constants/abi/QuantumSwapRouter.json";
import erc20Abi from "../constants/abi/QuantumSwapPair.json"; // contains ERC20 ABI subset for demo (balance/allowance/approve)
import factoryAbi from "../constants/abi/QuantumSwapFactory.json";
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
import { useTransactionStatus } from "../hooks/useTransactionStatus";
import { TokenInput } from "./ui/TokenInput";

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface SwapComponentProps {
  onTokenChange?: (inputToken: TokenInfo | null, outputToken: TokenInfo | null) => void;
}

export function SwapComponent({ onTokenChange }: SwapComponentProps) {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const weth = (contracts?.WETH ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const defaults = getDefaultTokens(chainId);
  const [inputToken, setInputToken] = useState<TokenInfo | null>(defaults[0]);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(defaults[1]);
  
  // Notify parent component when tokens change
  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(inputToken, outputToken);
    }
  }, [inputToken, outputToken, onTokenChange]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [selecting, setSelecting] = useState<"in" | "out" | null>(null);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pendingApproval" | "approving" | "pendingSwap" | "swapping" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(30);
  const [approvalType, setApprovalType] = useState<"infinite" | "exact">("infinite");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Persist/load settings
  useEffect(() => {
    try {
      const s = localStorage.getItem("swap.slippageTolerance");
      const d = localStorage.getItem("swap.deadlineMinutes");
      const a = localStorage.getItem("swap.approvalType");
      if (s !== null) setSlippageTolerance(Number(s));
      if (d !== null) setDeadlineMinutes(Number(d));
      if (a === "infinite" || a === "exact") setApprovalType(a);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("swap.slippageTolerance", String(slippageTolerance));
      localStorage.setItem("swap.deadlineMinutes", String(deadlineMinutes));
      localStorage.setItem("swap.approvalType", approvalType);
    } catch {}
  }, [slippageTolerance, deadlineMinutes, approvalType]);

  const debouncedIn = useDebounce(inputAmount, 400);
  const debouncedOut = useDebounce(outputAmount, 400);

  const simplePath = useMemo(() => (inputToken && outputToken ? [inputToken.address, outputToken.address] : []), [inputToken, outputToken]);

  // Note: amountsOut/amountsIn moved below after pair existence check

  // Allowance check on input token (using Pair ABI as placeholder ERC20)
  const allowance = useReadContract({
    address: (inputToken?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi.abi as Abi,
    functionName: "allowance",
    args: account.address && inputToken ? [account.address, router] : undefined,
    query: { enabled: Boolean(account.address && inputToken) },
  });

  // Balance check for insufficient funds
  // Balance check (ERC-20). For native path, we will not use this and check via publicClient.getBalance if needed
  const balanceResult = useReadContract({
    address: (inputToken?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi.abi as Abi,
    functionName: "balanceOf",
    args: account.address && inputToken ? [account.address] : undefined,
    query: { enabled: Boolean(account.address && inputToken && inputToken.address.toLowerCase() !== weth.toLowerCase()), refetchInterval: 4000 },
  });
  const hasInsufficient = useMemo(() => {
    try {
      if (!inputToken || !inputAmount) return false;
      // If using native path (WETH as input), we cannot use ERC-20 balance; skip here and fallback to disabled by gas estimation/UI
      if (inputToken.address.toLowerCase() === weth.toLowerCase()) return false;
      if (!balanceResult.data) return false;
      const need = parseUnits(inputAmount || "0", inputToken.decimals ?? 18);
      const bal = balanceResult.data as unknown as bigint;
      return bal < need;
    } catch { return false; }
  }, [inputToken, inputAmount, balanceResult.data]);

  // Native balance guard when input is ETH (WETH path)
  const publicClient = usePublicClient();
  const [hasInsufficientEth, setHasInsufficientEth] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!publicClient || !account.address || !inputToken || inputToken.address.toLowerCase() !== weth.toLowerCase() || !inputAmount) {
          if (!cancelled) setHasInsufficientEth(false);
          return;
        }
        const bal = await publicClient.getBalance({ address: account.address as `0x${string}` });
        const need = parseUnits(inputAmount || "0", inputToken.decimals ?? 18);
        if (!cancelled) setHasInsufficientEth(bal < need);
      } catch {
        if (!cancelled) setHasInsufficientEth(false);
      }
    })();
    return () => { cancelled = true; };
  }, [publicClient, account.address, inputToken, inputAmount, weth]);

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });
  useTransactionStatus({
    isPending: !!txHash && receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
    error: receipt.error,
    hash: txHash as string,
  });

  // After a successful swap, clear inputs and trigger a lightweight refresh
  useEffect(() => {
    if (receipt.isSuccess) {
      setInputAmount("");
      setOutputAmount("");
    }
  }, [receipt.isSuccess]);

  // Pair + reserves for price impact
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
  const factory = (contracts?.QuantumSwapFactory ?? ZERO_ADDRESS) as `0x${string}`;
  const pairResult = useReadContract({
    address: factory,
    abi: factoryAbi.abi as Abi,
    functionName: "getPair",
    args: inputToken && outputToken ? [inputToken.address, outputToken.address] : undefined,
    query: { enabled: Boolean(inputToken && outputToken && factory !== ZERO_ADDRESS), refetchInterval: 8000 },
  });
  const pairAddress = (pairResult.data as `0x${string}` | undefined) ?? ZERO_ADDRESS;
  const pairExists = pairAddress !== ZERO_ADDRESS;
  // A-WETH and WETH-B pairs for smart routing
  const pairAWethResult = useReadContract({
    address: factory,
    abi: factoryAbi.abi as Abi,
    functionName: "getPair",
    args: inputToken ? [inputToken.address, weth] : undefined,
    query: { enabled: Boolean(inputToken && factory !== ZERO_ADDRESS), refetchInterval: 10000 },
  });
  const pairWethBResult = useReadContract({
    address: factory,
    abi: factoryAbi.abi as Abi,
    functionName: "getPair",
    args: outputToken ? [weth, outputToken.address] : undefined,
    query: { enabled: Boolean(outputToken && factory !== ZERO_ADDRESS), refetchInterval: 10000 },
  });
  // routePath will be computed later from selectedRoute (best of direct/weth)
  const token0Address = useReadContract({
    address: pairAddress,
    abi: erc20Abi.abi as Abi,
    functionName: "token0",
    args: undefined,
    query: { enabled: Boolean(pairExists), refetchInterval: 12000 },
  });
  const reservesResult = useReadContract({
    address: pairAddress,
    abi: erc20Abi.abi as Abi,
    functionName: "getReserves",
    args: undefined,
    query: { enabled: Boolean(pairExists), refetchInterval: 8000 },
  });

  // Quotes for both direct and via-WETH, then pick best
  const directPath = useMemo(() => (pairExists && inputToken && outputToken ? [inputToken.address, outputToken.address] as `0x${string}`[] : []), [pairExists, inputToken, outputToken]);
  const wethPath = useMemo(() => {
    const aW = (pairAWethResult.data as `0x${string}` | undefined) ?? ZERO_ADDRESS;
    const wB = (pairWethBResult.data as `0x${string}` | undefined) ?? ZERO_ADDRESS;
    if (aW !== ZERO_ADDRESS && wB !== ZERO_ADDRESS && inputToken && outputToken) return [inputToken.address, weth, outputToken.address] as `0x${string}`[];
    return [] as `0x${string}`[];
  }, [pairAWethResult.data, pairWethBResult.data, inputToken, outputToken, weth]);

  const amountsOutDirect = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsOut",
    args: inputAmount && directPath.length === 2 ? [parseUnits(debouncedIn || "0", inputToken?.decimals ?? 18), directPath] : undefined,
    query: { enabled: Boolean(inputAmount) && directPath.length === 2, refetchInterval: 4000 },
  });
  const amountsOutWeth = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsOut",
    args: inputAmount && wethPath.length === 3 ? [parseUnits(debouncedIn || "0", inputToken?.decimals ?? 18), wethPath] : undefined,
    query: { enabled: Boolean(inputAmount) && wethPath.length === 3, refetchInterval: 4000 },
  });

  const selectedRoute = useMemo(() => {
    const zero: { path: `0x${string}`[]; out?: bigint } = { path: [] };
    const directOut = amountsOutDirect.data ? (amountsOutDirect.data as unknown as bigint[]).slice(-1)[0] : undefined;
    const wethOut = amountsOutWeth.data ? (amountsOutWeth.data as unknown as bigint[]).slice(-1)[0] : undefined;
    if (directOut && wethOut) return directOut >= wethOut ? { path: directPath, out: directOut } : { path: wethPath, out: wethOut };
    if (directOut) return { path: directPath, out: directOut };
    if (wethOut) return { path: wethPath, out: wethOut };
    return zero;
  }, [amountsOutDirect.data, amountsOutWeth.data, directPath, wethPath]);

  const routePath = selectedRoute.path;
  const routeAvailable = routePath.length >= 2;

  const amountsIn = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsIn",
    args: outputAmount && routeAvailable ? [parseUnits(debouncedOut || "0", outputToken?.decimals ?? 18), routePath] : undefined,
    query: { enabled: Boolean(outputAmount) && routeAvailable, refetchInterval: 4000 },
  });

  // Update derived amounts (from selected route)
  useMemo(() => {
    if (selectedRoute.out && inputToken && outputToken) {
      const out = selectedRoute.out as bigint;
      setOutputAmount((Number(out) / 10 ** (outputToken.decimals || 18)).toString());
    }
  }, [selectedRoute.out, inputToken, outputToken]);

  useMemo(() => {
    if (amountsIn.data && inputToken && outputToken && !inputAmount) {
      const arr = amountsIn.data as unknown as bigint[];
      const reqIn = arr[0];
      setInputAmount((Number(reqIn) / 10 ** (inputToken.decimals || 18)).toString());
    }
  }, [amountsIn.data, inputAmount, inputToken, outputToken]);

  const needsApproval = useMemo(() => {
    if (!inputAmount || !allowance.data || !inputToken) return false;
    // No ERC-20 approval needed when sending native via WETH path
    if (inputToken.address.toLowerCase() === weth.toLowerCase()) return false;
    const needed = BigInt(Math.floor(Number(inputAmount) * 10 ** (inputToken.decimals || 18)));
    try {
      return (allowance.data as unknown as bigint) < needed;
    } catch {
      return false;
    }
  }, [allowance.data, inputAmount, inputToken]);

  // Derived price display
  const priceText = useMemo(() => {
    if (!inputToken || !outputToken) return "-";
    const inAmt = Number(inputAmount || "0");
    const outAmt = Number(outputAmount || "0");
    if (inAmt > 0 && outAmt > 0) {
      const rate = outAmt / inAmt;
      return `1 ${inputToken.symbol} ≈ ${rate.toFixed(6)} ${outputToken.symbol}`;
    }
    return "-";
  }, [inputAmount, outputAmount, inputToken, outputToken]);

  function computeAmountOutMin(calculatedOut: bigint, slippagePct: number): bigint {
    const slippage = BigInt(Math.floor((Number(calculatedOut) * slippagePct) / 100));
    return calculatedOut - slippage;
  }

  // Trade details
  const minReceivedText = useMemo(() => {
    if (!selectedRoute.out || !outputToken) return "-";
    const outBig = selectedRoute.out as bigint;
    const minOut = computeAmountOutMin(outBig, slippageTolerance);
    try {
      return `${Number(formatUnits(minOut, outputToken.decimals ?? 18)).toFixed(6)} ${outputToken.symbol}`;
    } catch {
      return "-";
    }
  }, [selectedRoute.out, outputToken, slippageTolerance]);

  const lpFeeText = useMemo(() => {
    if (!inputToken || !inputAmount) return "-";
    const amt = Number(inputAmount || "0");
    if (!isFinite(amt) || amt <= 0) return "-";
    const fee = amt * 0.003; // 0.3%
    return `${fee.toFixed(6)} ${inputToken.symbol}`;
  }, [inputAmount, inputToken]);

  const priceImpactPct = useMemo(() => {
    try {
      if (!reservesResult.data || !token0Address.data || !inputToken || !outputToken || !inputAmount) return null;
      // Only compute price impact for direct 2-hop path (single pair)
      if (routePath.length !== 2) return null;
      const [r0, r1] = reservesResult.data as unknown as [bigint, bigint, bigint];
      const token0 = (token0Address.data as `0x${string}`).toLowerCase();
      const inputIs0 = token0 === inputToken.address.toLowerCase();
      const reserveIn = inputIs0 ? r0 : r1;
      const reserveOut = inputIs0 ? r1 : r0;
      const reserveInNorm = Number(formatUnits(reserveIn, inputToken.decimals ?? 18));
      const reserveOutNorm = Number(formatUnits(reserveOut, outputToken.decimals ?? 18));
      if (!(reserveInNorm > 0 && reserveOutNorm > 0)) return null;
      const midPrice = reserveOutNorm / reserveInNorm;
      const amountInNorm = Number(inputAmount);
      if (!(amountInNorm > 0)) return null;
      if (!selectedRoute.out) return null;
      const outBig = selectedRoute.out as bigint;
      const amountOutNorm = Number(formatUnits(outBig, outputToken.decimals ?? 18));
      if (!(amountOutNorm > 0)) return null;
      const executionPrice = amountOutNorm / amountInNorm;
      const impact = Math.max(0, ((midPrice - executionPrice) / midPrice) * 100);
      if (!isFinite(impact)) return null;
      return impact;
    } catch {
      return null;
    }
  }, [reservesResult.data, token0Address.data, inputToken, outputToken, inputAmount, selectedRoute.out]);

  // Gas estimate
  const block = useBlockNumber({ watch: true });
  const [gasInfo, setGasInfo] = useState<{ gas: bigint; gasPrice: bigint } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setGasInfo(null);
      try {
        if (!publicClient || !account.address || !inputToken || !outputToken || !inputAmount) return;
        const amountInBI = parseUnits(inputAmount || "0", inputToken.decimals ?? 18);
        let minOut = 0n;
        if (selectedRoute.out) {
          const outBig = selectedRoute.out as bigint;
          minOut = computeAmountOutMin(outBig, slippageTolerance);
        }
        const isInputWeth = inputToken.address.toLowerCase() === weth.toLowerCase();
        const isOutputWeth = outputToken.address.toLowerCase() === weth.toLowerCase();
        const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
        const gas = await publicClient.estimateContractGas(
          isInputWeth && !isOutputWeth
            ? {
                address: router,
                abi: routerAbi.abi as Abi,
                functionName: "swapExactETHForTokens",
                args: [minOut, [weth, outputToken.address], account.address as `0x${string}`, deadline],
                account: account.address as `0x${string}`,
                value: amountInBI,
              }
            : !isInputWeth && isOutputWeth
            ? {
                address: router,
                abi: routerAbi.abi as Abi,
                functionName: "swapExactTokensForETH",
                args: [amountInBI, minOut, [inputToken.address, weth], account.address as `0x${string}`, deadline],
                account: account.address as `0x${string}`,
              }
            : {
                address: router,
                abi: routerAbi.abi as Abi,
                functionName: "swapExactTokensForTokens",
                args: [amountInBI, minOut, routePath, account.address as `0x${string}`, deadline],
                account: account.address as `0x${string}`,
              }
        );
        const gasPrice = await publicClient.getGasPrice();
        if (!cancelled) setGasInfo({ gas, gasPrice });
      } catch {
        if (!cancelled) setGasInfo(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [publicClient, account.address, inputToken, outputToken, inputAmount, selectedRoute.out, slippageTolerance, deadlineMinutes, routePath, router, block.data]);

  async function onApprove() {
    if (!inputToken) return;
    setTxStatus("approving");
    try {
      const hash = await writeContractAsync({
        address: inputToken.address,
        abi: erc20Abi.abi as Abi,
        functionName: "approve",
        args: [
          router,
          approvalType === "infinite"
            ? (BigInt(2) ** BigInt(256) - BigInt(1))
            : parseUnits(inputAmount || "0", inputToken.decimals ?? 18),
        ],
      });
      setTxHash(hash as `0x${string}`);
      setTxStatus("pendingSwap");
    } catch {
      setTxStatus("error");
    }
  }

  async function onSwap() {
    if (!inputToken || !outputToken || !routeAvailable || !inputAmount) return;
    setTxStatus("swapping");
    try {
      const amountIn = parseUnits(inputAmount || "0", inputToken.decimals || 18);
      // Compute min out with slippage if we have a quote
      let minOut = 0n;
      if (selectedRoute.out) {
        const outBig = selectedRoute.out as bigint;
        minOut = computeAmountOutMin(outBig, slippageTolerance);
      }
      const isInputWeth = inputToken.address.toLowerCase() === weth.toLowerCase();
      const isOutputWeth = outputToken.address.toLowerCase() === weth.toLowerCase();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
      let hash: string | undefined;
      if (isInputWeth && !isOutputWeth) {
        hash = await writeContractAsync({
          address: router,
          abi: routerAbi.abi as Abi,
          functionName: "swapExactETHForTokens",
          args: [minOut, [weth, outputToken.address], account.address!, deadline],
          value: amountIn,
        }) as string;
      } else if (!isInputWeth && isOutputWeth) {
        hash = await writeContractAsync({
          address: router,
          abi: routerAbi.abi as Abi,
          functionName: "swapExactTokensForETH",
          args: [amountIn, minOut, [inputToken.address, weth], account.address!, deadline],
        }) as string;
      } else {
        const args = [amountIn, minOut, routePath, account.address!, deadline] as const;
        hash = await writeContractAsync({
        address: router,
        abi: routerAbi.abi as Abi,
        functionName: "swapExactTokensForTokens",
          args,
        }) as string;
      }
      setTxHash(hash as `0x${string}`);
      setTxStatus("success");
    } catch {
      setTxStatus("error");
    }
  }

  const highImpact = priceImpactPct != null && priceImpactPct > 15;
  const actionLabel = useMemo(() => {
    if (!account.isConnected) return "Connect Wallet";
    if (!inputToken || !outputToken) return "Select a token";
    if (!inputAmount) return "Enter amount";
    if (!routeAvailable) return "No route for this pair";
    if (highImpact) return "High price impact";
    if (hasInsufficient || hasInsufficientEth) return `Insufficient ${inputToken.symbol} balance`;
    if (needsApproval) return `Approve ${inputToken.symbol}`;
    return "Swap";
  }, [account.isConnected, inputToken, outputToken, inputAmount, needsApproval, routeAvailable, highImpact, hasInsufficient, hasInsufficientEth]);

  async function onAction() {
    if (!account.isConnected) return; // Navbar button manages connection
    if (!inputToken || !outputToken || !inputAmount) return;
    if (!routeAvailable) return;
    if (highImpact) {
      setConfirmOpen(true);
      return;
    }
    if (needsApproval) return onApprove();
    return onSwap();
  }

  return (
    <Box 
      maxW="520px" 
      w="100%" 
      borderWidth="1px" 
      borderColor="cardBorder" 
      rounded="xl" 
      p={6} 
      bg="cardBg" 
      boxShadow="xl"
      position="relative"
      overflow="hidden"
    >
      {/* Gradient background effect */}
      <Box 
        position="absolute" 
        top="0" 
        left="0" 
        right="0" 
        height="6px" 
        bgGradient="linear(to-r, brand.500, purple.500)"
      />
      
      <Flex direction="column" align="stretch" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" mb={1} fontWeight="bold">Swap</Heading>
          <IconButton 
            aria-label="settings" 
            variant="ghost" 
            colorScheme="brand"
            rounded="full"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙️
          </IconButton>
        </Flex>

        <TokenInput
          refreshKey={Number(txHash || 0)}
          label="From"
          token={inputToken}
          amount={inputAmount}
          onAmountChange={(v) => { setInputAmount(v); setOutputAmount(""); }}
          onSetMax={async () => {
            try {
              if (!inputToken || !account.address || !publicClient) return;
              const bal = await publicClient.readContract({
                address: inputToken.address,
                abi: erc20Abi.abi as Abi,
                functionName: "balanceOf",
                args: [account.address as `0x${string}`],
              });
              const asNum = Number(formatUnits(bal as bigint, inputToken.decimals ?? 18));
              setInputAmount(asNum.toString());
              setOutputAmount("");
            } catch {}
          }}
          onTokenSelect={() => setSelecting("in")}
        />
        
        <HStack justify="center" my={1}>
          <IconButton 
            aria-label="invert" 
            variant="solid"
            colorScheme="brand"
            rounded="full"
            size="sm"
            onClick={() => {
              const a = inputToken; const b = outputToken; setInputToken(b); setOutputToken(a);
              const ai = inputAmount; const ao = outputAmount; setInputAmount(ao); setOutputAmount(ai);
            }}
          >
            <FiArrowDown />
          </IconButton>
        </HStack>

        <TokenInput
          refreshKey={Number(txHash || 0)}
          label="To"
          token={outputToken}
          amount={outputAmount}
          onAmountChange={(v) => { setOutputAmount(v); setInputAmount(""); }}
          onTokenSelect={() => setSelecting("out")}
        />

        {/* Price information */}
        {inputToken && outputToken && inputAmount && outputAmount && (
          <Box 
            bg="blackAlpha.300" 
            px={3} 
            py={2} 
            rounded="md"
            fontSize="sm"
          >
            <Flex justify="space-between">
              <Text color="gray.400">Price:</Text>
              <Text fontWeight="medium">{priceText}</Text>
            </Flex>
          </Box>
        )}

        <Button 
          colorScheme="brand" 
          onClick={onAction} 
          loading={txStatus === "approving" || txStatus === "swapping"} 
          disabled={!inputToken || !outputToken || !inputAmount || hasInsufficient} 
          _disabled={{ opacity: 0.6, cursor: "not-allowed" }} 
          height="48px" 
          rounded="md" 
          fontWeight="bold"
          fontSize="md"
          _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
          transition="all 0.2s"
        >
          {actionLabel}
        </Button>
        
        <Box>
          <Button 
            variant="ghost" 
            colorScheme="brand" 
            size="sm" 
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? "Hide details ↑" : "Show details ↓"}
          </Button>
          {detailsOpen && (
            <Box 
              mt={2} 
              fontSize="sm" 
              color="gray.400" 
              bg="blackAlpha.300" 
              p={3} 
              rounded="md"
            >
              {inputToken && outputToken && (
                <>
                  <Flex justify="space-between" mb={2}>
                    <Text>Min received:</Text>
                    <Text fontWeight="medium">{(amountsOutDirect.isLoading || amountsOutWeth.isLoading) ? "…" : minReceivedText}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Price impact:</Text>
                    <Text fontWeight="medium" color={priceImpactPct != null && priceImpactPct > 5 ? "orange.300" : "inherit"}>
                      {(amountsOutDirect.isLoading || amountsOutWeth.isLoading) ? "…" : (priceImpactPct == null ? "-" : `${priceImpactPct.toFixed(2)}%`)}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Liquidity provider fee:</Text>
                    <Text fontWeight="medium">{lpFeeText}</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Estimated gas:</Text>
                    <Text fontWeight="medium">
                      {gasInfo ? `~${Number(formatUnits(gasInfo.gas * gasInfo.gasPrice, 18)).toFixed(6)} ETH (${gasInfo.gas.toString()} gas)` : "…"}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Deadline:</Text>
                    <Text fontWeight="medium">{deadlineMinutes} minutes</Text>
                  </Flex>
                </>
              )}
              <Flex justify="space-between" mb={2}>
                <Text>Slippage tolerance:</Text>
                <Text fontWeight="medium">{slippageTolerance}%</Text>
              </Flex>
              
              {routePath.length > 1 && (
                <Flex justify="space-between">
                  <Text>Routing through:</Text>
                  <Text fontWeight="medium">{inputToken?.symbol} {routePath.length === 3 ? "→ WETH →" : "→"} {outputToken?.symbol}</Text>
                </Flex>
              )}
              
              {/* Transaction status indicator */}
              {txStatus !== "idle" && (
                <Flex justify="space-between" mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.200">
                  <Text>Transaction status:</Text>
                  <Text 
                    fontWeight="medium" 
                    color={
                      txStatus === "error" ? "red.400" : 
                      txStatus === "success" ? "green.400" : 
                      "yellow.400"
                    }
                  >
                    {txStatus.charAt(0).toUpperCase() + txStatus.slice(1)}
                  </Text>
                </Flex>
              )}

              <Flex justify="space-between" mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.200">
                <Text>Last updated:</Text>
                <Text fontWeight="medium">{block.data ? `block ${block.data.toString()}` : "-"}</Text>
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => (selecting === "in" ? setInputToken(t) : setOutputToken(t))}
      />

      {/* Confirm Modal (simple inline) */}
      {confirmOpen && (
        <Box position="fixed" inset={0} bg="blackAlpha.700" zIndex={1000} onClick={() => setConfirmOpen(false)}>
          <Box
            onClick={(e) => e.stopPropagation()}
            bg="cardBg"
            borderWidth="1px"
            borderColor="cardBorder"
            rounded="xl"
            shadow="xl"
            w="full"
            maxW="420px"
            mx="auto"
            mt="20vh"
            p={5}
          >
            <Heading size="md" mb={3}>High Price Impact</Heading>
            <Text fontSize="sm" color="gray.400" mb={4}>
              The estimated price impact is {priceImpactPct?.toFixed(2)}%. Proceed with this trade?
            </Text>
            <HStack justify="flex-end" gap={3}>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button colorScheme="red" onClick={async () => { setConfirmOpen(false); await onSwap(); }}>Proceed</Button>
            </HStack>
          </Box>
        </Box>
      )}

      {/* Settings Overlay */}
      {settingsOpen && (
        <Box position="fixed" inset={0} bg="blackAlpha.700" zIndex={1000} onClick={() => setSettingsOpen(false)}>
          <Box
            onClick={(e) => e.stopPropagation()}
            bg="cardBg"
            borderWidth="1px"
            borderColor="cardBorder"
            rounded="xl"
            shadow="xl"
            w="full"
            maxW="420px"
            mx="auto"
            mt="15vh"
            p={5}
            position="relative"
            overflow="hidden"
          >
            {/* Gradient header */}
            <Box 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              height="4px" 
              bgGradient="linear(to-r, brand.500, purple.500)"
            />
            
            <Heading size="md" mb={4}>Swap Settings</Heading>
            
            <Flex direction="column" gap={4}>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Slippage Tolerance</Text>
                <HStack gap={3}>
                {[0.1, 0.5, 1.0].map((v) => (
                    <Button 
                      key={v} 
                      variant={slippageTolerance === v ? "solid" : "outline"} 
                      colorScheme="brand" 
                      size="sm" 
                      onClick={() => setSlippageTolerance(v)}
                      flex="1"
                    >
                    {v}%
                  </Button>
                ))}
              </HStack>
              </Box>
              
              <Flex align="center" gap={2}>
                <Text fontSize="sm" fontWeight="medium">Custom:</Text>
                <Box 
                  flex="1"
                  borderWidth="1px"
                  borderColor="whiteAlpha.300"
                  rounded="md"
                  px={3}
                  py={2}
                >
                  <Flex align="center">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(Number(e.target.value))}
                      style={{ 
                        width: "100%", 
                        background: "transparent", 
                        border: "none", 
                        outline: "none",
                        color: "inherit",
                      }}
                />
                <Text>%</Text>
                  </Flex>
                </Box>
              </Flex>
              
              {slippageTolerance > 5 && (
                <Box bg="orange.900" color="orange.200" px={3} py={2} rounded="md" fontSize="sm">
                  Warning: High slippage tolerance. Your transaction may be frontrun.
                </Box>
              )}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Approval Type</Text>
                <HStack gap={3}>
                  {(["infinite", "exact"] as const).map((v) => (
                    <Button
                      key={v}
                      variant={approvalType === v ? "solid" : "outline"}
                      colorScheme="brand"
                      size="sm"
                      onClick={() => setApprovalType(v)}
                    >
                      {v === "infinite" ? "Infinite" : "Exact"}
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {approvalType === "infinite" ? "Convenient, fewer approvals" : "Safer, approves only this amount"}
                </Text>
              </Box>
              
              <Flex justify="flex-end" pt={3}>
                <Button 
                  onClick={() => setSettingsOpen(false)} 
                  colorScheme="brand" 
                  variant="solid"
                >
                  Save & Close
                </Button>
              </Flex>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}


