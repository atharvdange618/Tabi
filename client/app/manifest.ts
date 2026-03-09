import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabi - Collaborative Trip Planning",
    short_name: "Tabi",
    description:
      "Plan trips together seamlessly. Build itineraries, track budgets, and collaborate in real-time.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#93CDFF",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/logo-for-og-image.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["travel", "productivity", "lifestyle"],
    lang: "en",
    dir: "ltr",
  };
}
