import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TaxWise Uganda — Professional Tax & Compliance Platform",
  description: "A professional tax intelligence and compliance platform for consultants, accountants, lawyers, and business owners in Uganda. Features TAT ruling analyzer, learning hub, and statutory compliance checks.",
  keywords: ["TaxWise", "Uganda", "Tax Appeals Tribunal", "URA", "eFRIS", "VAT", "PAYE", "Tax Calculator"],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

