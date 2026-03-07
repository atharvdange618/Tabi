"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { useSplits, useCreateSettlement } from "../../hooks/useBudget";
import type { SplitBalance } from "shared/types";

export function SplitsSection({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: splits, isLoading } = useSplits(tripId);
  const createSettlement = useCreateSettlement(tripId);
  const [pending, setPending] = useState<SplitBalance | null>(null);

  if (isLoading) {
    return (
      <div className="brutal-card rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="brutal-card rounded-lg p-5">
        <h3 className="text-lg font-semibold font-display mb-4">
          Split Balances
        </h3>

        {!splits || splits.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <CheckCircle2 size={16} className="text-brand-mint" />
            All expenses are settled.
          </div>
        ) : (
          <div className="space-y-2">
            {splits.map((split) => (
              <div
                key={`${split.fromUserId}-${split.toUserId}`}
                className="brutal-card rounded-lg p-4 flex items-center gap-4"
              >
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium font-body truncate">
                    {split.fromUserName}
                  </span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm font-medium font-body truncate">
                    {split.toUserName}
                  </span>
                </div>
                <span className="text-sm font-bold font-mono shrink-0">
                  ₹{split.amount.toLocaleString("en-IN")}
                </span>
                {canEdit && (
                <Button
                  variant="ghost"
                  onClick={() => setPending(split)}
                  className="brutal-button bg-brand-mint px-3 py-1.5 rounded-md text-xs h-auto shrink-0"
                >
                  Mark as Settled
                </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Settlement</DialogTitle>
            <DialogDescription>
              Record that{" "}
              <span className="font-semibold">{pending?.fromUserName}</span> has
              paid <span className="font-semibold">{pending?.toUserName}</span>{" "}
              <span className="font-mono font-bold">
                ₹{pending?.amount.toLocaleString("en-IN")}
              </span>
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPending(null)}
              className="text-sm text-muted-foreground hover:bg-transparent p-0 h-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={createSettlement.isPending}
              onClick={() => {
                if (!pending) return;
                createSettlement.mutate(
                  {
                    fromUserId: pending.fromUserId,
                    toUserId: pending.toUserId,
                    amount: pending.amount,
                  },
                  { onSuccess: () => setPending(null) },
                );
              }}
              className="brutal-button bg-brand-mint px-4 py-2 rounded-md text-sm disabled:opacity-50 h-auto"
            >
              {createSettlement.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
