"use client";

import { useEffect, useRef } from "react";
import { useAppToast } from "../contexts/ToastContext";

type TxFlags = {
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: unknown;
  hash?: string;
};

export function useTransactionStatus({ isPending, isSuccess, isError, error, hash }: TxFlags) {
  const toast = useAppToast();
  const toastIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isPending) {
      toastIdRef.current = toast.push({ title: "Transaction submitted...", kind: "loading" });
    }
  }, [isPending, toast]);

  useEffect(() => {
    if (isSuccess) {
      toast.update(toastIdRef.current as number, { title: "Transaction confirmed!", description: hash ? `Hash: ${hash}` : undefined, kind: "success" });
    }
  }, [isSuccess, hash, toast]);

  useEffect(() => {
    if (isError) {
      const message = parseError(error);
      toast.update(toastIdRef.current as number, { title: "Transaction failed", description: message, kind: "error" });
    }
  }, [isError, error, toast]);
}

function parseError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const withShort = err as { shortMessage?: unknown };
    if (typeof withShort.shortMessage === "string") return withShort.shortMessage;
    const withMsg = err as { message?: unknown };
    if (typeof withMsg.message === "string") return withMsg.message;
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  }
  return "Unknown error";
}


