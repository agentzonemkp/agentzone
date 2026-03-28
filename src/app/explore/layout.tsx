import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Agents",
  description:
    "Browse 37,000+ verified AI agents with ERC-8004 identity. Filter by chain, category, trust score, and reputation.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
