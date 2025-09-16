import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { TopProgress } from "../components/ui/TopProgress";
import { CookieConsent } from "@/components/ui/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "QuantumSwap",
    template: "%s • QuantumSwap",
  },
  description: "A high-performance AMM DEX",
  applicationName: "QuantumSwap",
  icons: {
    icon: [
      { url: "/logo-quantum-gradient.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/logo-quantum-gradient.svg",
    // Add this file to improve iOS PWA icon support if desired
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1928",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Dynamic glow background layers */}
        <div className="glow-effect teal" />
        <div className="glow-effect blue" />
        <Providers>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Suspense fallback={null}>
              <TopProgress />
            </Suspense>
            <Navbar />
            <main style={{ flex: 1, width: "100%" }}>
              <Suspense fallback={
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "16px", background: "rgba(23,35,53,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                    <div style={{ width: "24px", height: "24px", border: "2px solid #00D1B2", borderRightColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Loading…</div>
                  </div>
                </div>
              }>
                {children}
              </Suspense>
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
