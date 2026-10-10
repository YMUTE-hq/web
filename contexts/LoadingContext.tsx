"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LogoLoader from "@/components/ui/LogoLoader";

interface LoadingContextType {
  isLoading: boolean;
  loadingLabel: string;
  showLoader: (label?: string) => void;
  hideLoader: () => void;
  startActionTransition: (action: () => Promise<void> | void, label?: string) => Promise<void>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Loading...");
  const [, startTransition] = useTransition();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Automatically hide loader when URL / pathname changes (page transition completes)
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Safety net: Auto-dismiss loader after 20 seconds to prevent frozen spinners on extreme timeouts
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const showLoader = (label: string = "Processing...") => {
    setLoadingLabel(label);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  const startActionTransition = async (action: () => Promise<void> | void, label: string = "Please wait...") => {
    setLoadingLabel(label);
    setIsLoading(true);
    try {
      let actionError: unknown = null;
      startTransition(() => {
        Promise.resolve()
          .then(() => action())
          .catch((e) => {
            actionError = e;
            console.error("[Loading] action failed:", e);
          })
          .finally(() => setIsLoading(false));
      });
      // Fallback: if transition never runs (e.g. test env), ensure we still await
      await Promise.resolve();
      if (actionError) throw actionError;
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingLabel,
        showLoader,
        hideLoader,
        startActionTransition,
      }}
    >
      {children}
      {isLoading && (
        <LogoLoader fullScreen size="lg" label={loadingLabel} />
      )}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return ctx;
}
