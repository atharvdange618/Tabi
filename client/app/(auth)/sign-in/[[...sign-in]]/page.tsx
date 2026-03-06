import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Tabi",
  description: "Sign in to your Tabi account to manage your trips.",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <SignIn />
    </main>
  );
}
