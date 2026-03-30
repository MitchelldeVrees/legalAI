const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zaakwijzer.nl";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/privacyverklaring", "/voorwaarden", "/beveiliging", "/dpa"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}

