import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiGIC · Sistema de Gestión Integral de Colación",
  description: "Portal administrativo y autogestión de graduados de SiGIC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
