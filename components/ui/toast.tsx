"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Toast = { id: string; title: string; description?: string };
type ToastContext = { toast: (toast: Omit<Toast, "id">) => void };

const Context = createContext<ToastContext | null>(null);
let toastCounter = 0;

function createToastId() {
  toastCounter += 1;
  return `${Date.now()}-${toastCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const value = useMemo(
    () => ({
      toast: (toast: Omit<Toast, "id">) => {
        const id = createToastId();
        setToasts((items) => [...items, { ...toast, id }]);
        window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500);
      }
    }),
    []
  );
  return (
    <Context.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-border bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p> : null}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

export function useToast() {
  const context = useContext(Context);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
