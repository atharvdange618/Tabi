"use client";

import { useState } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";
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
} from "@/hooks/useMembers";
import { toInitials, memberBg, mapRole } from "@/lib/helpers";

export function MembersTab({
  tripId,
  currentUserRole,
}: {
  tripId: string;
  currentUserRole: "admin" | "editor" | "viewer";
}) {
  const { data: membersData } = useMembers(tripId);
  const inviteMember = useInviteMember(tripId);
  const updateRole = useUpdateMemberRole(tripId);
  const removeMember = useRemoveMember(tripId);

  const active = membersData?.active ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Invite Member
            </DialogTitle>
          </DialogHeader>
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
    </div>
  );
}
