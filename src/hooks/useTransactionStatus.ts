"use client";

import { useEffect, useRef } from "react";
import { useAppToast } from "../contexts/ToastContext";
// This hook now supports JSX descriptions via ToastContext
import { useChainId } from "wagmi";

type TxFlags = {
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: unknown;
  hash?: string;
};

// --- THÊM MỚI: Helper để lấy URL của block explorer ---
function getBlockExplorerLink(chainId: number, hash: string): string | undefined {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",       // Mainnet
    11155111: "https://sepolia.etherscan.io/tx/", // Sepolia
    5: "https://goerli.etherscan.io/tx/",     // Goerli
    137: "https://polygonscan.com/tx/",   // Polygon
    80001: "https://mumbai.polygonscan.com/tx/", // Mumbai
    // Thêm các mạng khác nếu cần
  };
  return explorers[chainId] ? `${explorers[chainId]}${hash}` : undefined;
}

// --- HOOK ĐÃ ĐƯỢC THIẾT KẾ LẠI ---
export function useTransactionStatus({ isPending, isSuccess, isError, error, hash }: TxFlags) {
  const toast = useAppToast();
  const chainId = useChainId(); // Lấy chainId hiện tại
  const toastIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // 1. Gộp logic vào một useEffect duy nhất
    if (isPending) {
      // Chỉ tạo toast mới nếu chưa có
      if (!toastIdRef.current) {
        toastIdRef.current = toast.push({
          title: "Transaction submitted...",
          description: "Waiting for confirmation from the network.",
          kind: "loading",
        });
      }
    } else if (isSuccess && toastIdRef.current) {
      // 2. Cập nhật toast thành công với liên kết explorer (cho phép JSX ở description)
      const url = hash && chainId ? getBlockExplorerLink(chainId, hash) : undefined;
      toast.update(toastIdRef.current, {
        title: "Transaction Confirmed!",
        description: url ? `View on Block Explorer: ${url}` : "Your transaction was successful.",
        kind: "success",
      });
      toastIdRef.current = undefined; // Reset ref sau khi hoàn tất
    } else if (isError && toastIdRef.current) {
      // 3. Cập nhật toast lỗi với thông báo rõ ràng hơn
      const message = parseError(error);
      toast.update(toastIdRef.current, {
        title: "Transaction Failed",
        description: message,
        kind: "error",
      });
      toastIdRef.current = undefined; // Reset ref sau khi hoàn tất
    }
  }, [isPending, isSuccess, isError, error, hash, toast, chainId]);
}


// --- HÀM PARSE ERROR ĐƯỢC CẢI TIẾN ---
function parseError(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  
  // Xử lý các lỗi phổ biến nhất trước
  if (typeof err === 'object' && err !== null) {
    if ('shortMessage' in err && typeof err.shortMessage === 'string') {
      if (err.shortMessage.includes('UserRejectedRequestError')) {
        return "Transaction rejected by user.";
      }
      if (err.shortMessage.includes('insufficient funds')) {
        return "Insufficient funds for the transaction.";
      }
      return err.shortMessage;
    }
    if ('message' in err && typeof err.message === 'string') {
        if (err.message.includes('User rejected the request')) {
            return "Transaction rejected by user.";
        }
        return err.message;
    }
  }

  // Giữ lại logic fallback chi tiết
  if (typeof err === "string") return err;
  try {
    const str = JSON.stringify(err);
    if (str !== "{}") return str;
  } catch {}
  
  return "An unknown error occurred. Check the console for details.";
}