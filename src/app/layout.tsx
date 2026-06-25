import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { LegalFooter } from "@/components/LegalFooter";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Cashflux | Suivi de dépenses entre associés",
  description:
    "SaaS français pour suivre les dépenses de projet, équilibrer les avances et piloter les remboursements entre associés de TPE.",
  metadataBase: new URL("https://francofacta.vercel.app"),
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml"
      }
    ]
  },
  openGraph: {
    title: "Cashflux | Suivi de dépenses entre associés",
    description:
      "SaaS français pour suivre les dépenses de projet, équilibrer les avances et piloter les remboursements entre associés de TPE.",
    siteName: "Cashflux"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={`${inter.variable} ${playfair.variable}`}>
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
