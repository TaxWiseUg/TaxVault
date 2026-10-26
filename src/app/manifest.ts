import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TaxWise Uganda — Professional Tax & Compliance",
    short_name: "TaxWise",
    description: "Professional tax intelligence and compliance for Uganda.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F7F4",
    theme_color: "#1A7B6B",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/taxwise-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/taxwise-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/taxwise-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
