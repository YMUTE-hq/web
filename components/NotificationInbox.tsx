"use client";
import { Inbox, NovuProvider } from "@novu/react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER;
  const subscriberId = user?.id || "6a47e4ef860a3d9235056d31";

  return (
    <NovuProvider
      subscriberId={subscriberId}
      applicationIdentifier={applicationIdentifier || "Q54a39NtMvGP"}
    >
      <Inbox
        appearance={{
          variables: {
            colorPrimary: "#c8a137",
            colorPrimaryForeground: "#ffffff",
            colorSecondary: "#1f3a5f",
            colorSecondaryForeground: "#ffffff",
            colorBackground: "#fdfcf0",
            colorForeground: "#001f3f",
            colorNeutral: "#1f3a5f",
            fontSize: "14px",
          },
        }}
      />
    </NovuProvider>
  );
}
