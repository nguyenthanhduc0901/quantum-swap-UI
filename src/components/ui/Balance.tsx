"use client";

import { Skeleton, Text } from "@chakra-ui/react";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

type Props = {
  tokenAddress: `0x${string}`;
  // Thêm prop để tùy chỉnh màu chữ nếu cần
  textColor?: string; 
};

export function Balance({ tokenAddress, textColor = "whiteAlpha.600" }: Props) {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { data, isLoading } = useBalance({
    address,
    token: tokenAddress,
    query: { enabled: Boolean(address), refetchOnWindowFocus: true },
  });

  // Avoid hydration mismatch: render nothing until mounted, then show skeleton while loading
  if (!mounted) return null;
  if (isLoading) return <Skeleton height="18px" width="120px" rounded="md" />;

  // 2. Cập nhật màu sắc cho trạng thái không có dữ liệu
  if (!data) {
    return (
      <Text fontSize="sm" color={textColor}>
        Balance: -
      </Text>
    );
  }

  // Logic định dạng giữ nguyên
  const formatted = ethers.formatUnits(data.value, data.decimals);
  
  // Hiển thị số với tối đa 4 chữ số thập phân để gọn hơn
  const short = Number(formatted).toLocaleString(undefined, {
    maximumFractionDigits: 4, 
  });

  // 3. Cập nhật màu sắc và thêm label "Balance:" cho rõ ràng
  return (
    <Text fontSize="sm" color={textColor} whiteSpace="nowrap">
      Balance: {short}
    </Text>
  );
}