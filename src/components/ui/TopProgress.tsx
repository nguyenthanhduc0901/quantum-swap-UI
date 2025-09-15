"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgress() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 });
  }, []);

  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 300); // finish quickly for client transitions
    return () => clearTimeout(t);
  }, [pathname, search?.toString()]);

  return null;
}


