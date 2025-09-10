"use client";

import { useMemo, useState } from "react";
import { Box, Flex, HStack, Heading, Button, Input, Text, IconButton } from "@chakra-ui/react";
import { TokenInfo, getDefaultTokens } from "../constants/tokens";
import { TokenSelectModal } from "./ui/TokenSelectModal";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi } from "viem";
import routerAbi from "../constants/abi/QuantumSwapRouter.json";
import erc20Abi from "../constants/abi/QuantumSwapPair.json"; // contains ERC20 ABI subset for demo (balance/allowance/approve)
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
import { Balance } from "./ui/Balance";
import { useTransactionStatus } from "../hooks/useTransactionStatus";

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SwapComponent() {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const defaults = getDefaultTokens(chainId);
  const [inputToken, setInputToken] = useState<TokenInfo | null>(defaults[0]);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(defaults[1]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [selecting, setSelecting] = useState<"in" | "out" | null>(null);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pendingApproval" | "approving" | "pendingSwap" | "swapping" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const debouncedIn = useDebounce(inputAmount, 400);
  const debouncedOut = useDebounce(outputAmount, 400);

  const path = useMemo(() => (inputToken && outputToken ? [inputToken.address, outputToken.address] : []), [inputToken, outputToken]);

  const amountsOut = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsOut",
    args: inputAmount && path.length === 2 ? [BigInt(Math.floor(Number(debouncedIn || "0") * 10 ** (inputToken?.decimals ?? 18))), path] : undefined,
    query: { enabled: Boolean(inputAmount) && path.length === 2 },
  });

  const amountsIn = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsIn",
    args: outputAmount && path.length === 2 ? [BigInt(Math.floor(Number(debouncedOut || "0") * 10 ** (outputToken?.decimals ?? 18))), path] : undefined,
    query: { enabled: Boolean(outputAmount) && path.length === 2 },
  });

  // Update derived amounts
  useMemo(() => {
    if (amountsOut.data && inputToken && outputToken) {
      const arr = amountsOut.data as unknown as bigint[];
      const out = arr[arr.length - 1];
      setOutputAmount((Number(out) / 10 ** (outputToken.decimals || 18)).toString());
    }
  }, [amountsOut.data, inputToken, outputToken]);

  useMemo(() => {
    if (amountsIn.data && inputToken && outputToken && !inputAmount) {
      const arr = amountsIn.data as unknown as bigint[];
      const reqIn = arr[0];
      setInputAmount((Number(reqIn) / 10 ** (inputToken.decimals || 18)).toString());
    }
  }, [amountsIn.data, inputAmount, inputToken, outputToken]);

  // Allowance check on input token (using Pair ABI as placeholder ERC20)
  const allowance = useReadContract({
    address: (inputToken?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi.abi as Abi,
    functionName: "allowance",
    args: account.address && inputToken ? [account.address, router] : undefined,
    query: { enabled: Boolean(account.address && inputToken) },
  });

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });
  useTransactionStatus({
    isPending: !!txHash && receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
    error: receipt.error,
    hash: txHash as string,
  });

  const needsApproval = useMemo(() => {
    if (!inputAmount || !allowance.data || !inputToken) return false;
    const needed = BigInt(Math.floor(Number(inputAmount) * 10 ** (inputToken.decimals || 18)));
    try {
      return (allowance.data as unknown as bigint) < needed;
    } catch {
      return false;
    }
  }, [allowance.data, inputAmount, inputToken]);

  async function onApprove() {
    if (!inputToken) return;
    setTxStatus("approving");
    try {
      const hash = await writeContractAsync({
        address: inputToken.address,
        abi: erc20Abi.abi as Abi,
        functionName: "approve",
        args: [router, BigInt(2) ** BigInt(256) - BigInt(1)],
      });
      setTxHash(hash as `0x${string}`);
      setTxStatus("pendingSwap");
    } catch {
      setTxStatus("error");
    }
  }

  async function onSwap() {
    if (!inputToken || !outputToken || !path.length || !inputAmount) return;
    setTxStatus("swapping");
    try {
      const amountIn = BigInt(Math.floor(Number(inputAmount) * 10 ** (inputToken.decimals || 18)));
      const hash = await writeContractAsync({
        address: router,
        abi: routerAbi.abi as Abi,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, 0n, path, account.address!, BigInt(Math.floor(Date.now() / 1000) + 1800)],
      });
      setTxHash(hash as `0x${string}`);
      setTxStatus("success");
    } catch {
      setTxStatus("error");
    }
  }

  const actionLabel = useMemo(() => {
    if (!account.isConnected) return "Connect Wallet";
    if (!inputToken || !outputToken) return "Select a token";
    if (!inputAmount) return "Enter amount";
    if (needsApproval) return `Approve ${inputToken.symbol}`;
    return "Swap";
  }, [account.isConnected, inputToken, outputToken, inputAmount, needsApproval]);

  async function onAction() {
    if (!account.isConnected) return; // Navbar button manages connection
    if (!inputToken || !outputToken || !inputAmount) return;
    if (needsApproval) return onApprove();
    return onSwap();
  }

  return (
    <Box maxW="480px" w="100%" borderWidth="1px" borderColor="gray.200" rounded="lg" p={5} bg="white">
      <Flex direction="column" align="stretch" gap={4}>
        <Heading size="md">Swap</Heading>

        <Flex direction="column" align="stretch" gap={2}>
          <Text fontSize="sm" color="gray.600">From</Text>
          <HStack>
            <Button onClick={() => setSelecting("in")} variant="outline">
              {inputToken?.symbol ?? "Select"}
            </Button>
            <Input type="number" placeholder="0.0" value={inputAmount} onChange={(e) => { setInputAmount(e.target.value); setOutputAmount(""); }} />
          </HStack>
          {inputToken && <Balance tokenAddress={inputToken.address} />}
        </Flex>

        <HStack justify="center">
          <IconButton aria-label="invert" onClick={() => {
            const a = inputToken; const b = outputToken; setInputToken(b); setOutputToken(a);
            const ai = inputAmount; const ao = outputAmount; setInputAmount(ao); setOutputAmount(ai);
          }} />
        </HStack>

        <Flex direction="column" align="stretch" gap={2}>
          <Text fontSize="sm" color="gray.600">To</Text>
          <HStack>
            <Button onClick={() => setSelecting("out")} variant="outline">
              {outputToken?.symbol ?? "Select"}
            </Button>
            <Input type="number" placeholder="0.0" value={outputAmount} onChange={(e) => { setOutputAmount(e.target.value); setInputAmount(""); }} />
          </HStack>
          {outputToken && <Balance tokenAddress={outputToken.address} />}
        </Flex>

        <Button colorScheme="teal" onClick={onAction} loading={txStatus === "approving" || txStatus === "swapping"}>
          {actionLabel}
        </Button>
      </Flex>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => (selecting === "in" ? setInputToken(t) : setOutputToken(t))}
      />
    </Box>
  );
}


