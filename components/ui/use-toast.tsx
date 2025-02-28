"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

const ToastContext = React.createContext<{ toast: (message: string) => void } | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const toast = (message: string) => {
    setMessage(message);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastPrimitives.Root open={open} onOpenChange={setOpen} className={cn("fixed bottom-4 right-4 bg-black text-white p-4 rounded-md shadow-lg")}>
        <ToastPrimitives.Title>{message}</ToastPrimitives.Title>
      </ToastPrimitives.Root>
    </ToastContext.Provider>
  );
}
