import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaInstallProvider } from "@/components/PwaInstallProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1A7B6B",
};

export const metadata: Metadata = {
  title: "TaxWise Uganda — Professional Tax & Compliance Platform",
  description: "A professional tax intelligence and compliance platform for consultants, accountants, lawyers, and business owners in Uganda. Features TAT ruling analyzer, learning hub, and statutory compliance checks.",
  keywords: ["TaxWise", "Uganda", "Tax Appeals Tribunal", "URA", "eFRIS", "VAT", "PAYE", "Tax Calculator"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/taxwise-icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icons/taxwise-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaxWise",
  },
  openGraph: {
    title: "TaxWise Uganda — Professional Tax & Compliance Platform",
    description: "Statutory analysis of Tax Appeals Tribunal (TAT) rulings, compliance checking tools for eFRIS, VAT, and PAYE, and structured tax education.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <Script id="theme-initializer" strategy="beforeInteractive">{`
              try {
                var theme = localStorage.getItem('taxwise_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else if (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `}</Script>
      </head>
      <body>
        <PwaInstallProvider>{children}</PwaInstallProvider>
      </body>
    </html>
  );
}

