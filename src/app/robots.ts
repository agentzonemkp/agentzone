import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/console/"],
      },
    ],
    sitemap: "https://agentzone.fun/sitemap.xml",
  };
}
