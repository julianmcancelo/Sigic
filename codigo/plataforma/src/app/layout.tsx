import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@jcancelo/mapa-asientos-sigic/dist/style.css";
import { BadgeVersion } from "../componentes/BadgeVersion";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SiGIC · Sistema de Gestión Integral de Colación",
  description: "Portal administrativo y autogestión de graduados de SiGIC",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <BadgeVersion />
      </body>
    </html>
  );
}
