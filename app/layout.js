import "./globals.css";

export const metadata = {
  title: "LegalAI | AI voor advocatenkantoren in Nederland",
  description:
    "Versnel contractanalyse, jurisprudentieonderzoek en juridische vraagbeantwoording met ECLI-bronnen en workflow voor Nederlandse advocatenkantoren.",
  icons: {
    icon: [{ url: "/logo-bg.png", type: "image/png" }],
    shortcut: ["/logo-bg.png"],
    apple: [{ url: "/logo-bg.png", type: "image/png" }]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
