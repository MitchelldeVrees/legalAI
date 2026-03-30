import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  metadataBase: new URL("https://www.zaakwijzer.nl"),
  title: {
    default: "AI juridisch onderzoek advocatenkantoor | Zaakwijzer",
    template: "%s | Zaakwijzer"
  },
  description:
    "Zaakwijzer is AI juridisch onderzoek voor het advocatenkantoor: jurisprudentie zoeken AI, ECLI automatisch opzoeken, contractanalyse en juridische research tool voor advocaat software Nederland.",
  applicationName: "Zaakwijzer",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: ["/icons/favicon-32x32.png"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "AI juridisch onderzoek advocatenkantoor | Zaakwijzer",
    description:
      "AI juridisch onderzoek voor Nederlandse advocatenkantoren met jurisprudentie zoeken AI en ECLI automatisch opzoeken.",
    url: "https://www.zaakwijzer.nl",
    siteName: "Zaakwijzer",
    locale: "nl_NL",
    type: "website",
    images: [{ url: "/logo-bg.png", width: 1200, height: 1200, alt: "Zaakwijzer" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI juridisch onderzoek advocatenkantoor | Zaakwijzer",
    description:
      "Jurisprudentie zoeken AI, ECLI automatisch opzoeken en contractanalyse voor Nederlandse advocatenkantoren.",
    images: ["/logo-bg.png"]
  }
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Zaakwijzer",
  applicationCategory: "LegalService",
  description:
    "AI-tool voor jurisprudentie onderzoek en contractanalyse voor Nederlandse advocatenkantoren",
  offers: { "@type": "Offer", availability: "https://schema.org/InStoreOnly" },
  audience: { "@type": "Audience", audienceType: "Advocatenkantoren" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
