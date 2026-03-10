"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MoreHorizontal,
  UserPlus,
  X,
  LogOut,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { brutalBtnSm, roleConfig } from "./_shared";
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useRevokeInvite,
  useTransferOwnership,
  useLeaveTripSelf,
} from "@/hooks/useMembers";
import { toInitials, memberBg, mapRole } from "@/lib/helpers";

export function MembersTab({
  tripId,
  currentUserRole,
}: {
  tripId: string;
  currentUserRole: "admin" | "editor" | "viewer";
}) {
  const router = useRouter();
  const { data: membersData } = useMembers(tripId);
  const inviteMember = useInviteMember(tripId);
  const updateRole = useUpdateMemberRole(tripId);
  const removeMember = useRemoveMember(tripId);
  const revokeInvite = useRevokeInvite(tripId);
  const transferOwnership = useTransferOwnership(tripId);
  const leaveTripSelf = useLeaveTripSelf(tripId);

  const active = membersData?.active ?? [];
  const pending = membersData?.pending ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [leaveTripOpen, setLeaveTripOpen] = useState(false);

  const isOwner = currentUserRole === "admin";
  const currentTripTitle =
    document.querySelector<HTMLHeadingElement>("h1")?.textContent ||
    "this trip";

  function handleInvite() {
    inviteMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteRole("editor");
        },
      },
    );
  }

  function handleTransferOwnership() {
    if (!transferTarget) return;
    transferOwnership.mutate(transferTarget.userId, {
      onSuccess: () => {
        setTransferOwnershipOpen(false);
        setTransferTarget(null);
      },
    });
  }

  function handleLeaveTrip() {
    leaveTripSelf.mutate(undefined, {
      onSuccess: () => {
        setLeaveTripOpen(false);
        router.push("/dashboard");
      },
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-base">
          {active.length} {active.length === 1 ? "member" : "members"}
        </p>
        {currentUserRole === "admin" && (
          <Button
            size="sm"
            className={cn(brutalBtnSm, "gap-1.5")}
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={12} />
            Invite
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {active.map((member, index) => {
          const displayRole = mapRole(member.role);
          const { label, cls, Icon } = roleConfig[displayRole];

          return (
            <div
              key={member._id}
              className="flex items-center gap-4 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-sm font-bold shrink-0",
                  memberBg(index),
                )}
              >
                {toInitials(member.userId?.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {member.userId?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-[#9CA3AF] font-medium">
                  {member.userId?.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "border text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                    cls,
                  )}
                >
                  <Icon size={9} />
                  {label}
                </Badge>

                {currentUserRole === "admin" && member.role !== "owner" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 border border-transparent hover:border-[#1A1A1A] rounded"
                      >
                        <MoreHorizontal size={12} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
                    >
                      {isOwner && member.status === "active" && (
                        <>
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onSelect={() => {
                              setTransferTarget({
                                userId: member.userId?._id ?? "",
                                name: member.userId?.name ?? "this member",
                              });
                              setTransferOwnershipOpen(true);
                            }}
                          >
                            <Crown size={12} className="mr-1.5" />
                            Transfer ownership
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-xs font-medium cursor-pointer"
                        onSelect={() =>
                          updateRole.mutate({
                            userId: member.userId?._id ?? "",
                            role: "editor",
                          })
                        }
                      >
                        Make editor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium cursor-pointer"
                        onSelect={() =>
                          updateRole.mutate({
                            userId: member.userId?._id ?? "",
                            role: "viewer",
                          })
                        }
                      >
                        Make viewer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs font-medium text-red-600 cursor-pointer"
                        onSelect={() =>
                          removeMember.mutate(member.userId?._id ?? "")
                        }
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isOwner && (
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full border-2 border-[#1A1A1A] rounded-lg font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setLeaveTripOpen(true)}
          >
            <LogOut size={14} className="mr-2" />
            Leave Trip
          </Button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-6">
          <p className="font-display font-bold text-sm uppercase tracking-wide text-[#6B7280] mb-3 flex items-center gap-1.5">
            <Clock size={13} />
            Pending Invites ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((invite) => {
              const { label, cls, Icon } = roleConfig[mapRole(invite.role)];
              return (
                <div
                  key={invite._id}
                  className="flex items-center gap-4 bg-white border-2 border-dashed border-[#1A1A1A] rounded-xl p-4"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#1A1A1A] bg-[#f4f4f5] flex items-center justify-center text-sm font-bold shrink-0 text-[#9CA3AF]">
                    ?
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#6B7280]">
                      {invite.email ?? invite.userId?.email ?? "Unknown"}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      Invite sent · awaiting response
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "border text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-60",
                        cls,
                      )}
                    >
                      <Icon size={9} />
                      {label}
                    </Badge>
                    {currentUserRole === "admin" && (
                      <button
                        onClick={() => revokeInvite.mutate(invite._id)}
                        disabled={revokeInvite.isPending}
                        title="Revoke invite"
                        className="h-7 px-2 flex items-center gap-1 text-[11px] font-bold border-2 border-[#1A1A1A] rounded-lg shadow-[2px_2px_0px_#1A1A1A] bg-brand-coral text-[#111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <X size={11} strokeWidth={2.5} />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Invite Member
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-brand-lemon/40 border border-brand-lemon px-3 py-2.5 text-xs text-[#333] leading-relaxed">
            <span className="font-bold text-[#111]">How it works: </span>
            Enter the person&apos;s email below. They&apos;ll receive an email
            with a link to accept or decline the invite. Once accepted, they
            appear as an active member here.
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Email *
              </Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="friend@example.com"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}
              >
                <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                  <SelectItem value="editor" className="text-sm">
                    Editor =&gt; can add & edit content
                  </SelectItem>
                  <SelectItem value="viewer" className="text-sm">
                    Viewer =&gt; read only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !inviteEmail.trim() ||
                !inviteEmail.includes("@") ||
                inviteMember.isPending
              }
              onClick={handleInvite}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all rounded-lg"
            >
              {inviteMember.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transferOwnershipOpen}
        onOpenChange={setTransferOwnershipOpen}
      >
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">
              Transfer Ownership
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-brand-lemon/40 border border-brand-lemon px-3 py-2.5 text-xs text-[#333] leading-relaxed">
            <span className="font-bold text-[#111]">Warning: </span>
            You will become an editor. {transferTarget?.name} must accept this
            transfer to become the owner. Until accepted, you remain the owner.
          </div>
          <p className="text-sm text-gray-700">
            Are you sure you want to transfer ownership of this trip to{" "}
            <span className="font-bold">{transferTarget?.name}</span>?
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => {
                setTransferOwnershipOpen(false);
                setTransferTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={transferOwnership.isPending}
              onClick={handleTransferOwnership}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all rounded-lg"
            >
              {transferOwnership.isPending ? "Transferring…" : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Trip Dialog */}
      <Dialog open={leaveTripOpen} onOpenChange={setLeaveTripOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">
              Leave Trip
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Are you sure you want to leave{" "}
            <span className="font-bold">{currentTripTitle}</span>? You will lose
            access to all trip data and will need to be re-invited to rejoin.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setLeaveTripOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={leaveTripSelf.isPending}
              onClick={handleLeaveTrip}
              className="bg-brand-coral text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-coral transition-all rounded-lg"
            >
              {leaveTripSelf.isPending ? "Leaving…" : "Leave Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
