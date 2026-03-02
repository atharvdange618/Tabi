import type { Metadata } from "next";
import {
  Space_Grotesk,
  DM_Sans,
  JetBrains_Mono,
  Noto_Sans_JP,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400"],
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Tabi - Collaborative Trip Planning",
    template: "%s | Tabi",
  },
  description:
    "Plan trips together. Build itineraries, track budgets, and collaborate in real time.",
  keywords: [
    "trip planning",
    "travel itinerary",
    "collaborative travel",
    "group trips",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Tabi",
    title: "Tabi - Collaborative Trip Planning",
    description:
      "Plan trips together. Build itineraries, track budgets, and collaborate in real time.",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabi - Collaborative Trip Planning",
    description:
      "Plan trips together. Build itineraries, track budgets, and collaborate in real time.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${notoSansJp.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
