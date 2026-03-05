"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useDeclineInvite } from "../../../../hooks/useMembers";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeclineInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const declineInvite = useDeclineInvite();
  const triggered = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/invites/${params.token}/decline`)}`,
      );
      return;
    }

    if (triggered.current) return;
    triggered.current = true;
    declineInvite.mutate(params.token);
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!declineInvite.isSuccess) return;
    const timer = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(timer);
  }, [declineInvite.isSuccess, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <div className="brutal-card rounded-lg p-8 max-w-md w-full text-center">
        {(!isLoaded || declineInvite.isPending) && (
          <>
            <Loader2
              className="mx-auto mb-4 animate-spin text-muted-foreground"
              size={40}
            />
            <h1 className="text-2xl font-bold font-display mb-2">
              Declining Invite…
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              Just a moment while we process your response.
            </p>
          </>
        )}

        {declineInvite.isSuccess && (
          <>
            <CheckCircle2
              className="mx-auto mb-4 text-muted-foreground"
              size={40}
            />
            <h1 className="text-2xl font-bold font-display mb-2">
              Invite Declined
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              No worries — you can always be invited again. Redirecting…
            </p>
          </>
        )}

        {declineInvite.isError && (
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
              className="brutal-button bg-brand-coral px-6 py-2 rounded-md text-sm h-auto"
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
