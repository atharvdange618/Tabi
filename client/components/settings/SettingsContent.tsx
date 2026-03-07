"use client";

import { useParams } from "next/navigation";
import { useTrip, useDeleteTrip } from "../../hooks/useTrips";
import { useMembers } from "../../hooks/useMembers";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, Settings } from "lucide-react";

export default function SettingsContent() {
  const params = useParams<{ id: string }>();
  const { data: trip, isLoading: isTripLoading } = useTrip(params.id);
  const { data: members, isLoading: isMembersLoading } = useMembers(params.id);
  const { user } = useUser();
  const deleteTrip = useDeleteTrip();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isTripLoading || isMembersLoading || !user) {
    return (
      <div className="brutal-card p-6 min-h-[200px] flex items-center justify-center bg-white/50">
        <div className="animate-pulse flex items-center gap-3">
          <Settings className="animate-spin text-brand-blue" size={24} />
          <span className="font-display font-bold text-muted-foreground">
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  const currentUserEmail = user.primaryEmailAddress?.emailAddress;
  const ownerMember = members?.active?.find((m) => m.role === "owner");
  const isOwner = ownerMember?.userId?.email === currentUserEmail;

  const handleDelete = () => {
    if (deleteConfirmText === "DELETE") {
      deleteTrip.mutate(params.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">
            Trip Settings
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage your trip configuration
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Danger Zone */}
        {isOwner && (
          <div className="brutal-card rounded-xl p-6 bg-red-50 border-red-200 border-2 border-dashed">
            <h3 className="text-lg font-bold font-display text-red-600 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              Danger Zone
            </h3>
            <p className="text-sm text-gray-700 font-body mb-4">
              Once you delete a trip, there is no going back. Please be certain.
            </p>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="brutal-button bg-red-500 hover:bg-red-600 text-white border-2 border-red-700 shadow-[4px_4px_0px_#b91c1c] hover:shadow-[2px_2px_0px_#b91c1c]">
                  <Trash2 size={16} className="mr-2" />
                  Delete Trip
                </Button>
              </DialogTrigger>
              <DialogContent className="brutal-card max-w-md border-red-500">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-500 rounded-lg border-2 border-red-700 shadow-[2px_2px_0px_#b91c1c] flex items-center justify-center -rotate-3 text-white">
                      <Trash2 size={20} strokeWidth={2.5} />
                    </div>
                    <DialogTitle className="text-2xl font-bold font-display text-red-600">
                      Delete Trip
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-gray-700 font-body">
                    This action cannot be undone. This will permanently delete
                    your trip <strong>{trip?.title}</strong> and remove all
                    associated data including itinerary, reservations, and files
                    from our servers.
                  </DialogDescription>
                </DialogHeader>

                <div className="my-4">
                  <p className="text-sm font-body mb-2 text-gray-800">
                    Please type{" "}
                    <strong className="font-mono bg-red-100 border border-red-200 text-red-700 px-1 py-0.5 rounded text-xs select-all">
                      DELETE
                    </strong>{" "}
                    to confirm.
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="brutal-input font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-dashed border-red-200 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setDeleteConfirmText("");
                    }}
                    className="brutal-button bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      deleteConfirmText !== "DELETE" || deleteTrip.isPending
                    }
                    onClick={handleDelete}
                    className="brutal-button bg-red-500 hover:bg-red-600 text-white border-2 border-red-700 shadow-[4px_4px_0px_#b91c1c] hover:shadow-[2px_2px_0px_#b91c1c]"
                  >
                    {deleteTrip.isPending
                      ? "Deleting..."
                      : "Permanently Delete Trip"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {!isOwner && (
          <div className="brutal-card rounded-xl p-6 bg-white/50 text-center text-muted-foreground font-body">
            Only the trip owner can access and modify trip settings.
          </div>
        )}
      </div>
    </div>
  );
}
