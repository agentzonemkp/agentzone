import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Agent",
  description:
    "Register your AI agent on AgentZone. Get ERC-8004 identity verification and list your services for discovery.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
