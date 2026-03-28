import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Real-time analytics for the ERC-8004 agent ecosystem. Registration trends, chain distribution, top agents, and payment volume.",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
