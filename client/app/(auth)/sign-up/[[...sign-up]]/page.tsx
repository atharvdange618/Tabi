import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Tabi account and start planning your trips together.",
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
