"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, arbitrum, mainnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "AgentZone",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [base, arbitrum, mainnet],
  ssr: true,
});
