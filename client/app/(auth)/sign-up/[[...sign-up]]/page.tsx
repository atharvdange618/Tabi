import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { createCanonicalUrl, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create a ${SITE_NAME} account and start planning your trips together. Build itineraries, track budgets, and collaborate with your travel group in real time.`,
  alternates: {
    canonical: createCanonicalUrl("/sign-up"),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <SignUp fallbackRedirectUrl={redirect_url ?? "/dashboard"} />
    </main>
  );
}
