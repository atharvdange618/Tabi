"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useAcceptOwnershipTransfer,
  useDeclineOwnershipTransfer,
} from "@/hooks/useMembers";
import type { PopulatedTripMember } from "shared/types";

interface OwnershipTransferAlertProps {
  tripId: string;
  currentUser: PopulatedTripMember | null | undefined;
}

export function OwnershipTransferAlert({
  tripId,
  currentUser,
}: OwnershipTransferAlertProps) {
  const acceptMutation = useAcceptOwnershipTransfer(tripId);
  const declineMutation = useDeclineOwnershipTransfer(tripId);

  if (!currentUser?.pendingOwnershipTransfer) {
    return null;
  }

  const { fromUserId } = currentUser.pendingOwnershipTransfer;

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  const handleDecline = () => {
    declineMutation.mutate();
  };

  const isLoading = acceptMutation.isPending || declineMutation.isPending;

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium">{fromUserId.name}</span> wants to transfer
          ownership of this trip to you. This will make you the new owner and
          they will become an editor.
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <X className="h-3 w-3 mr-1" />
            Decline
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
