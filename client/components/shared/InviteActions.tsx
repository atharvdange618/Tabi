"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useAcceptInvite, useDeclineInvite } from "../../hooks/useMembers";
import { Check, X, Loader2, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InviteActions() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const isPending = acceptInvite.isPending || declineInvite.isPending;

  function handleAccept() {
    if (!isSignedIn) {
      const redirectUrl = encodeURIComponent(`/invites/${params.token}/accept`);
      router.push(`/sign-up?redirect_url=${redirectUrl}`);
      return;
    }
    acceptInvite.mutate(params.token, {
      onSuccess: () => {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      },
    });
  }

  function handleDecline() {
    if (!isSignedIn) {
      const redirectUrl = encodeURIComponent(
        `/invites/${params.token}/decline`,
      );
      router.push(`/sign-up?redirect_url=${redirectUrl}`);
      return;
    }
    declineInvite.mutate(params.token, {
      onSuccess: () => {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      },
    });
  }

  if (acceptInvite.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="brutal-card bg-brand-mint/20 border-brand-mint">
          <UserPlus className="h-5 w-5 text-brand-mint" />
          <AlertTitle className="font-display font-bold text-lg">
            Invitation Accepted!
          </AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            You&apos;ve been added to the trip. Redirecting to your dashboard...
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-mint" />
        </div>
      </div>
    );
  }

  if (declineInvite.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="brutal-card bg-brand-coral/20 border-brand-coral">
          <UserX className="h-5 w-5 text-brand-coral" />
          <AlertTitle className="font-display font-bold text-lg">
            Invitation Declined
          </AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            You&apos;ve declined the invitation. Redirecting...
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-coral" />
        </div>
      </div>
    );
  }

  if (acceptInvite.isError || declineInvite.isError) {
    return (
      <div className="space-y-4">
        <Alert className="brutal-card bg-destructive/20 border-destructive">
          <X className="h-5 w-5 text-destructive" />
          <AlertTitle className="font-display font-bold text-lg">
            Something went wrong
          </AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            {acceptInvite.error?.message ||
              declineInvite.error?.message ||
              "Unable to process your request. Please try again."}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="brutal-button w-full"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="brutal-button bg-brand-mint hover:bg-brand-mint/90 text-foreground px-8 py-6 text-base"
        size="lg"
      >
        {acceptInvite.isPending ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Check size={20} strokeWidth={2.5} />
        )}
        Accept Invitation
      </Button>
      <Button
        onClick={handleDecline}
        disabled={isPending}
        variant="destructive"
        className="brutal-button bg-brand-coral hover:bg-brand-coral/90 text-foreground px-8 py-6 text-base"
        size="lg"
      >
        {declineInvite.isPending ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <X size={20} strokeWidth={2.5} />
        )}
        Decline
      </Button>
    </div>
  );
}
