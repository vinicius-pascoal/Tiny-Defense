import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// Fredoka é uma fonte variável: sem `weight`, carrega todo o eixo (300–700) em um único arquivo.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-rounded", "system-ui", "Segoe UI", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Tiny Defense",
  description: "Tower defense 2D em pixel art: defenda o castelo com torres e moedas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
