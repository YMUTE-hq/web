"use client";
import React, { Suspense, useState, useEffect, createContext, useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LogoLoader from "@/components/ui/LogoLoader";

interface DashboardTabContextType {
  triggerTabLoading: (label?: string) => void;
}

const DashboardTabContext = createContext<DashboardTabContextType | undefined>(undefined);

export function useDashboardTab() {
  return useContext(DashboardTabContext);
}

export default function DashboardTabWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Loading Content...");

  // Clear loader when route navigation finishes
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsTabLoading(false);
    });
    return () => cancelAnimationFrame(timer);
  }, [pathname, searchParams]);

  const triggerTabLoading = (label: string = "Loading Content...") => {
    setLoadingLabel(label);
    setIsTabLoading(true);
  };

  // Intercept click on any sidebar dashboard link to show content-side loader INSTANTLY
  useEffect(() => {
    const handleSidebarLinkClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (href && href.startsWith("/dashboard") && href !== pathname) {
        setLoadingLabel("Loading Content...");
        setIsTabLoading(true);
      }
    };

    window.addEventListener("click", handleSidebarLinkClick, { capture: true });
    return () => window.removeEventListener("click", handleSidebarLinkClick, { capture: true });
  }, [pathname]);

  return (
    <DashboardTabContext.Provider value={{ triggerTabLoading }}>
      <div className="relative min-h-[500px] w-full flex flex-col flex-1">
        {isTabLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background-light/85 backdrop-blur-md rounded-3xl min-h-[450px] transition-all">
            <LogoLoader size="lg" label={loadingLabel} />
          </div>
        )}
        <Suspense
          fallback={
            <div className="min-h-[450px] w-full flex items-center justify-center py-16">
              <LogoLoader size="lg" label="Loading Content..." />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </DashboardTabContext.Provider>
  );
}
