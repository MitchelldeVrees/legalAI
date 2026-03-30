const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zaakwijzer.nl";

const toAbsoluteUrl = (path) => {
  const base = String(SITE_URL || "").replace(/\/+$/, "");
  const suffix = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export default function sitemap() {
  const lastModified = new Date();
  const routes = [
    "/",
    "/login",
    "/signup",
    "/contact",
    "/dashboard",
    "/document-upload",
    "/jurispudentie-search",
    "/vraag-stellen",
    "/voorwaarden",
    "/privacyverklaring",
    "/dpa",
    "/beveiliging",
    "/vacatures"
  ];

  return routes.map((path) => ({
    url: toAbsoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7
  }));
}
