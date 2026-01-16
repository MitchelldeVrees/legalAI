import "./globals.css";

export const metadata = {
  title: "LegalAI - Opstellen. Beoordelen. Verdedigen.",
  description: "Een gedurfde landingspagina voor een juridische AI-omgeving."
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
