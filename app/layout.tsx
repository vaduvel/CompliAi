import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/evidence-os/Toaster";
import { CookieConsent } from "@/components/compliscan/cookie-consent";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "CompliScan",
  title: {
    default: "CompliScan – Tablou de bord",
    template: "%s | CompliScan",
  },
  description:
    "Asistent AI care îți scanează documentele și îți arată riscurile (EU AI Act + GDPR + e-Factura).",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "CompliScan – Tablou de bord",
    description:
      "Asistent AI pentru conformitate GDPR, NIS2, EU AI Act și e-Factura, cu finding-uri, dovadă și dosar operațional.",
    url: "/",
    siteName: "CompliScan",
    locale: "ro_RO",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CompliScan – Tablou de bord",
    description:
      "Asistent AI pentru conformitate GDPR, NIS2, EU AI Act și e-Factura.",
  },
};

export const viewport: Viewport = {
  themeColor: "#090b10",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
