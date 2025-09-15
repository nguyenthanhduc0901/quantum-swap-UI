import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { TopProgress } from "../components/ui/TopProgress";

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
            <TopProgress />
            <Navbar />
            <main style={{ flex: 1, width: "100%" }}>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
