import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CompliScan",
    short_name: "CompliScan",
    description:
      "Asistent AI pentru conformitate GDPR, NIS2, EU AI Act și e-Factura.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090b10",
    theme_color: "#2563eb",
    lang: "ro-RO",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
