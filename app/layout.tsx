import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/evidence-os/Toaster";
import { CookieConsent } from "@/components/compliscan/cookie-consent";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

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
    <html
      lang="ro"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${interTight.variable} ${ibmPlexMono.variable}`}
    >
      <body suppressHydrationWarning className="antialiased font-sans">
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
