"use client";

import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type HistoryBackButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  children: ReactNode;
  fallbackHref?: string;
};

export function HistoryBackButton({
  children,
  fallbackHref = "/dashboard/classroom-tools",
  ...props
}: HistoryBackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={goBack} {...props}>
      {children}
    </button>
  );
}
