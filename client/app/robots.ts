import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/trips/", "/invites/"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://tabi.vercel.app"}/sitemap.xml`,
  };
}
