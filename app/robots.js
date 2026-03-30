export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/"
      },
      {
        userAgent: "ClaudeBot",
        allow: "/"
      },
      {
        userAgent: "GPTBot",
        allow: "/"
      },
      {
        userAgent: "PerplexityBot",
        allow: "/"
      }
    ],
    sitemap: "https://www.zaakwijzer.nl/sitemap.xml"
  };
}
