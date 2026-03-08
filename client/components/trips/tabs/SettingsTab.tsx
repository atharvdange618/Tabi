"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBudgetSettings, useUpdateBudgetSettings } from "@/hooks/useBudget";
import { useTrip, useUpdateTrip, useDeleteTrip } from "@/hooks/useTrips";

export function SettingsTab({
  tripId,
  isOwner,
  canEdit,
  tripTitle,
}: {
  tripId: string;
  isOwner: boolean;
  canEdit: boolean;
  tripTitle: string;
}) {
  const { data: trip } = useTrip(tripId);
  const { data: budgetSettings } = useBudgetSettings(tripId);
  const updateBudget = useUpdateBudgetSettings(tripId);
  const updateTrip = useUpdateTrip(tripId);
  const deleteTrip = useDeleteTrip();

  const [budgetInput, setBudgetInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/${tripId}`;

  function handleSaveBudget() {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    updateBudget.mutate({ totalBudget: val });
    setBudgetInput("");
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDeleteTrip() {
    if (deleteConfirm !== tripTitle) return;
    deleteTrip.mutate(tripId);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-[#1A1A1A] bg-brand-cream">
          <p className="font-display font-black text-sm uppercase tracking-wide">
            Budget Settings
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <p className="text-xs font-medium text-[#6B7280]">
              Current total budget
            </p>
            <p className="font-display font-black text-2xl mt-0.5">
              ₹{(budgetSettings?.totalBudget ?? 0).toLocaleString()}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs font-bold uppercase tracking-wide">
                  New budget (₹)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "-") e.preventDefault();
                    if (e.key === "Enter") handleSaveBudget();
                  }}
                  className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                  placeholder="e.g. 100000"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSaveBudget}
                  disabled={!budgetInput || updateBudget.isPending}
                  className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 rounded-lg mb-px"
                >
                  {updateBudget.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-[#1A1A1A] bg-brand-cream">
            <p className="font-display font-black text-sm uppercase tracking-wide">
              Public Access
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Allow public view</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Anyone with the link can view this trip (read-only).
                </p>
              </div>
              <Switch
                checked={trip?.isPublic ?? false}
                onCheckedChange={(checked) =>
                  updateTrip.mutate({ isPublic: checked })
                }
              />
            </div>
            {trip?.isPublic && (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-brand-cream border border-[#e5e7eb] px-3 py-2 rounded-lg font-mono text-[#6B7280] truncate">
                  {publicUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-[#1A1A1A] rounded-lg font-bold shrink-0 gap-1.5"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-green-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="bg-white border-2 border-red-500 shadow-[4px_4px_0px_#ef4444] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-red-200 bg-red-50">
            <p className="font-display font-black text-sm uppercase tracking-wide text-red-600">
              Danger Zone
            </p>
          </div>
          <div className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Delete this trip</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Permanently deletes all data - itinerary, expenses, files, and
                more.
              </p>
            </div>
            <Button
              onClick={() => setDeleteOpen(true)}
              className="bg-red-500 text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold rounded-lg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-red-500 transition-all duration-150 shrink-0"
            >
              Delete trip
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase text-red-600">
              Delete Trip?
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280]">
              This is permanent and cannot be undone. Type{" "}
              <strong className="text-[#111]">{tripTitle}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="border-2 border-[#1A1A1A] rounded-lg"
              placeholder={tripTitle}
            />
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={deleteConfirm !== tripTitle || deleteTrip.isPending}
              onClick={handleDeleteTrip}
              className="bg-red-500 text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold rounded-lg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-red-500 transition-all duration-150"
            >
              {deleteTrip.isPending ? "Deleting…" : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
