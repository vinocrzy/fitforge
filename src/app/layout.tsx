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
          colorText: "#F5F5F5",
          colorTextOnPrimaryBackground: "#0B0B0B",
          colorTextSecondary: "#A0A0A0",
          colorInputBackground: "#252525",
          colorInputText: "#F5F5F5",
          colorNeutral: "#F5F5F5",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "!bg-[#1A1A1A] !text-[#F5F5F5] shadow-xl border border-white/10",
          headerTitle: "!text-[#F5F5F5]",
          headerSubtitle: "!text-[#A0A0A0]",
          formFieldLabel: "!text-[#D0D0D0]",
          formFieldInput: "!bg-[#252525] !text-[#F5F5F5] !border-white/15 !placeholder-gray-500",
          formButtonPrimary: "!bg-[#C5F74F] !text-[#0B0B0B] font-semibold hover:!bg-[#d4ff6e]",
          footerActionLink: "!text-[#C5F74F] hover:!text-[#d4ff6e]",
          footerActionText: "!text-[#A0A0A0]",
          socialButtonsBlockButton: "!bg-[#252525] !text-[#F5F5F5] !border-white/15 hover:!bg-[#303030]",
          socialButtonsBlockButtonText: "!text-[#F5F5F5]",
          dividerLine: "!bg-white/10",
          dividerText: "!text-[#808080]",
          identityPreview: "!bg-[#252525] !border-white/15",
          identityPreviewText: "!text-[#F5F5F5]",
          identityPreviewEditButton: "!text-[#C5F74F]",
          formFieldAction: "!text-[#C5F74F]",
          alertText: "!text-[#D0D0D0]",
          otpCodeFieldInput: "!bg-[#252525] !text-[#F5F5F5] !border-white/15",
          formFieldSuccessText: "!text-[#30D158]",
          formFieldErrorText: "!text-[#FF453A]",
          internal: "!text-[#F5F5F5]",
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
