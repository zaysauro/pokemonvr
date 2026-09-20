import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon Card AR",
  description: "Experimental WebAR for real Pokémon cards",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
