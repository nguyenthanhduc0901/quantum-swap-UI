"use client";

import { Skeleton, Text } from "@chakra-ui/react";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";

export function Balance({ tokenAddress }: { tokenAddress: `0x${string}` }) {
  const { address } = useAccount();
  const { data, isLoading } = useBalance({
    address,
    token: tokenAddress,
    watch: true, // auto refetch on new blocks (after swap/add/remove)
    query: { enabled: Boolean(address), staleTime: 0, refetchOnWindowFocus: true },
  });

  if (isLoading) return <Skeleton height="16px" width="100px" />;
  if (!data) return <Text color="gray.500">-</Text>;

  const formatted = ethers.formatUnits(data.value, data.decimals);
  const short = Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 6 });
  return <Text color="gray.600">{short} {data.symbol}</Text>;
}




