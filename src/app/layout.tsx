import type { Metadata } from "next";
import "./globals.css";
import StyledJsxRegistry from "./registry";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SITE } from "@/lib/site-config";
import { configGet } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const images = (configGet("images") as Record<string, unknown>) || {};
  const faviconSrc = (images.faviconSrc as string) || SITE.images.favicon || "/shared/favicon.svg";
  const updatedAt = (images.updatedAt as number) || 0;
  const faviconUrl = updatedAt ? `${faviconSrc}?v=${updatedAt}` : faviconSrc;

  return {
    title: SITE.projectName,
    description: `Join the ${SITE.projectName} community`,
    icons: { icon: faviconUrl },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="kawaii">
      <body>
        <AdminAuthProvider>
          <StyledJsxRegistry>{children}</StyledJsxRegistry>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
