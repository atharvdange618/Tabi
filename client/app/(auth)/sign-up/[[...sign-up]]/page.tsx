import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Tabi account and start planning your trips together.",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <SignUp />
    </main>
  );
}
