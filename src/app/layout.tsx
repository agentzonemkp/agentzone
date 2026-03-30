import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentZone — Unified Explorer for Trustless AI Agents",
    template: "%s | AgentZone",
  },
  description:
    "Discover, verify, and transact with 37,000+ on-chain AI agents. ERC-8004 identity verification, x402 payments, and reputation scoring across Base, Arbitrum, and more.",
  metadataBase: new URL("https://agentzone.fun"),
  openGraph: {
    title: "AgentZone — Unified Explorer for Trustless AI Agents",
    description:
      "Discover, verify, and transact with 37,000+ on-chain AI agents across multiple chains.",
    url: "https://agentzone.fun",
    siteName: "AgentZone",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentZone — Unified Explorer for Trustless AI Agents",
    description:
      "37K+ verified AI agents. ERC-8004 identity + x402 payments + reputation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F8847587SH"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-F8847587SH');`}
        </Script>
      </head>
      <body className={`${jetbrains.variable} ${outfit.variable} font-mono antialiased bg-[#07080a] text-[#e8eaed]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
