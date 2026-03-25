import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { QueryProvider } from "@/lib/QueryProvider";

export const metadata: Metadata = {
  title: "FitForge — Build. Track. Dominate.",
  description:
    "Your personal fitness coach. Track workouts, build routines, and crush your goals.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitForge",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0B0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#C5F74F",
          colorBackground: "#1A1A1A",
          colorText: "#FFFFFF",
          colorTextOnPrimaryBackground: "#0B0B0B",
          colorTextSecondary: "#A0A0A0",
          colorInputBackground: "#141414",
          colorInputText: "#FFFFFF",
          colorNeutral: "#FFFFFF",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-[#1A1A1A] text-white shadow-xl border border-white/10",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          formFieldLabel: "text-gray-300",
          formFieldInput: "bg-[#141414] text-white border-white/10 placeholder:text-gray-500",
          formButtonPrimary: "bg-[#C5F74F] text-[#0B0B0B] hover:bg-[#d4ff6e]",
          footerActionLink: "text-[#C5F74F] hover:text-[#d4ff6e]",
          footerActionText: "text-gray-400",
          socialButtonsBlockButton: "bg-[#141414] text-white border-white/10 hover:bg-[#1F1F1F]",
          socialButtonsBlockButtonText: "text-white",
          dividerLine: "bg-white/10",
          dividerText: "text-gray-500",
          identityPreview: "bg-[#141414] border-white/10",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-[#C5F74F]",
          formFieldAction: "text-[#C5F74F]",
          alertText: "text-gray-300",
          otpCodeFieldInput: "bg-[#141414] text-white border-white/10",
        },
      }}
    >
      <html lang="en">
        <body className="antialiased bg-[#0B0B0B] text-[#F5F5F5]">
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
