import type { Metadata, Viewport } from "next";
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
    <html lang="en">
      <body className="antialiased bg-[#0B0B0B] text-[#F5F5F5]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
