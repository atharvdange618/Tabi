"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useAcceptInvite } from "../../../../hooks/useMembers";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const acceptInvite = useAcceptInvite();
  const triggered = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/invites/${params.token}/accept`)}`,
      );
      return;
    }

    if (triggered.current) return;
    triggered.current = true;
    acceptInvite.mutate(params.token);
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!acceptInvite.isSuccess) return;
    const timer = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(timer);
  }, [acceptInvite.isSuccess, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <div className="brutal-card rounded-lg p-8 max-w-md w-full text-center">
        {(!isLoaded || acceptInvite.isPending) && (
          <>
            <Loader2
              className="mx-auto mb-4 animate-spin text-muted-foreground"
              size={40}
            />
            <h1 className="text-2xl font-bold font-display mb-2">
              Accepting Invite…
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              Hang tight while we add you to the trip.
            </p>
          </>
        )}

        {acceptInvite.isSuccess && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={40} />
            <h1 className="text-2xl font-bold font-display mb-2">
              You&apos;re in!
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              Invitation accepted. Redirecting to your dashboard…
            </p>
          </>
        )}

        {acceptInvite.isError && (
          <>
            <XCircle className="mx-auto mb-4 text-destructive" size={40} />
            <h1 className="text-2xl font-bold font-display mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-6">
              This invite may have expired or already been used.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="brutal-button bg-brand-mint px-6 py-2 rounded-md text-sm h-auto"
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
