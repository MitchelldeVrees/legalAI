import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  metadataBase: new URL("https://www.zaakwijzer.nl"),
  title: {
    default: "Zaakwijzer | AI-ondersteuning voor advocatenkantoren",
    template: "%s | Zaakwijzer"
  },
  description:
    "Zaakwijzer helpt Nederlandse advocatenkantoren met snellere contractanalyse, jurisprudentieonderzoek en juridische vraagbeantwoording met ECLI-bronnen.",
  applicationName: "Zaakwijzer",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/apple-icon.png", type: "image/png" }]
  },
  openGraph: {
    title: "Zaakwijzer | AI-ondersteuning voor advocatenkantoren",
    description:
      "Werk sneller met contractanalyse, jurisprudentieonderzoek en onderbouwde antwoorden op basis van ECLI-bronnen.",
    url: "https://www.zaakwijzer.nl",
    siteName: "Zaakwijzer",
    locale: "nl_NL",
    type: "website",
    images: [{ url: "/logo-bg.png", width: 1200, height: 1200, alt: "Zaakwijzer" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Zaakwijzer | AI-ondersteuning voor advocatenkantoren",
    description:
      "Werk sneller met contractanalyse, jurisprudentieonderzoek en onderbouwde antwoorden op basis van ECLI-bronnen.",
    images: ["/logo-bg.png"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
