import { MetadataRoute } from "next";

const BASE = "https://agentzone.fun";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explore`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/analytics`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Fetch top agents for dynamic sitemap entries
  try {
    const res = await fetch(`${BASE}/api/v1/agents?limit=100`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const agents = (data.agents || []).map((a: { wallet_address: string }) => ({
        url: `${BASE}/agent/${a.wallet_address}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.6,
      }));
      return [...staticPages, ...agents];
    }
  } catch {}

  return staticPages;
}
