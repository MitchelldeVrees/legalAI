const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zaakwijzer.nl";

export default function sitemap() {
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    {
      url: `${baseUrl}/jurispudentie-search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    },
    { url: `${baseUrl}/vraag-stellen`, lastModified: now, changeFrequency: "weekly", priority: 0.7 }
  ];
}

