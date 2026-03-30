import "./globals.css";

export const metadata = {
  title: "LegalAI | AI voor advocatenkantoren in Nederland",
  description:
    "Versnel contractanalyse, jurisprudentieonderzoek en juridische vraagbeantwoording met ECLI-bronnen en workflow voor Nederlandse advocatenkantoren.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.zaakwijzer.nl"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "512x512" }]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
