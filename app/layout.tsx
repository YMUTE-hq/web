import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import ChatWidget from "@/components/chat/ChatWidget";
import { Suspense } from "react";
import LogoLoader from "@/components/ui/LogoLoader";

export const metadata: Metadata = {
  title: "YMUTE – Your Voice Deserves a Stage",
  description:
    "The world's leading marketplace for broadcasting talent and events. Connect with professional casters for your next big event.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Suspense fallback={<LogoLoader fullScreen size="lg" label="Loading YMUTE..." />}>
          <LoadingProvider>
            <AuthProvider>
              {children}
              <ChatWidget />
            </AuthProvider>
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
