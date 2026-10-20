import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { createCanonicalUrl, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${SITE_NAME} account to access your trip itineraries, budgets, and collaborative planning tools.`,
  alternates: {
    canonical: createCanonicalUrl("/sign-in"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  return <SignIn fallbackRedirectUrl={redirect_url ?? "/dashboard"} />;
}
