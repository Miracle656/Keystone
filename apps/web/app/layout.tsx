import type { Metadata } from "next";
import { Cal_Sans, Space_Grotesk, JetBrains_Mono, Figtree } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const calSans = Cal_Sans({
  variable: "--font-cal-sans",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Trading-app screens (Trade/Earn/Portfolio/…) use their own Claude-Design mockup export's
// palette + type (Figtree), distinct from Landing's Space Grotesk/Cal Sans — see the
// `.app-theme` scope in globals.css. Loaded at the root so Next's font optimizer can subset it
// once; only elements inside `.app-theme` actually reference `--font-figtree`.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keystone — the on-chain order book for internet money",
  description:
    "Any chain in. Arc execution. Real yield out. A fully on-chain central limit order book for stablecoin pairs on Arc, with a cross-chain USDC router and an ERC-4626 Earn vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${calSans.variable} ${jetBrainsMono.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans text-ink">
        {/* Ambient background: dark Arc-navy gradient (top deep navy, bottom
            lighter blue) with a warm gold glow, echoing arc.io's own hero. */}
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 90% at 82% 4%, rgba(231,178,90,0.16), transparent 46%), radial-gradient(100% 90% at 15% 105%, rgba(62,90,140,0.4), transparent 62%), linear-gradient(180deg, #0B1424 0%, #16294C 100%)",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-[60] opacity-5 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
