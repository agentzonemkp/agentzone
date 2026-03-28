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
      const seenUrls = new Set<string>();
      const agents = (data.agents || [])
        .map((a: { id: string }) => {
          const url = `${BASE}/agent/${encodeURIComponent(a.id)}`;
          if (seenUrls.has(url)) return null;
          seenUrls.add(url);
          return {
            url,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.6,
          };
        })
        .filter(Boolean);
      return [...staticPages, ...agents];
    }
  } catch {}

  return staticPages;
}
