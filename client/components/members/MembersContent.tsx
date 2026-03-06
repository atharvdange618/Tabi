"use client";

import { useParams } from "next/navigation";
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from "../../hooks/useMembers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inviteMemberSchema,
  type InviteMemberPayload,
} from "shared/validations";
import type { PopulatedTripMember } from "shared/types";
import {
  UserPlus,
  Trash2,
  Mail,
  Crown,
  Shield,
  Eye,
  Users,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

function RoleBadge({ role }: { role: string }) {
  const configs: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    owner: {
      color: "bg-brand-blue border-brand-blue",
      icon: <Crown size={10} />,
      label: "Owner",
    },
    editor: {
      color: "bg-brand-mint border-brand-mint",
      icon: <Shield size={10} />,
      label: "Editor",
    },
    viewer: {
      color: "bg-brand-lemon border-brand-lemon",
      icon: <Eye size={10} />,
      label: "Viewer",
    },
  };

  const config = configs[role] || configs.viewer;

  return (
    <Badge
      className={`brutal-badge text-[10px] ${config.color} inline-flex items-center gap-1`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function InviteMemberDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const inviteMember = useInviteMember(tripId);

  const form = useForm<InviteMemberPayload>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "editor",
    },
  });

  function onSubmit(data: InviteMemberPayload) {
    inviteMember.mutate(data, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="brutal-button bg-brand-blue hover:bg-brand-lemon">
          <UserPlus size={16} />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="brutal-card max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-mint rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_theme(--color-brutal-shadow)] flex items-center justify-center -rotate-3">
              <UserPlus size={20} strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-2xl font-bold font-display">
              Invite Member
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-body">
            Send an invitation to collaborate on this trip.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold font-display">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="friend@example.com"
                      className="brutal-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold font-display">
                    Role
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="brutal-input">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="brutal-card">
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <div>
                            <div className="font-semibold">Editor</div>
                            <div className="text-xs text-muted-foreground">
                              Can edit and manage trip
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye size={14} />
                          <div>
                            <div className="font-semibold">Viewer</div>
                            <div className="text-xs text-muted-foreground">
                              Can only view trip details
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMember.isPending}
                className="brutal-button bg-brand-mint hover:bg-brand-mint/90"
              >
                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MemberCard({
  member,
  tripId,
  isOwner,
}: {
  member: PopulatedTripMember;
  tripId: string;
  isOwner?: boolean;
}) {
  const updateRole = useUpdateMemberRole(tripId);
  const removeMember = useRemoveMember(tripId);

  return (
    <div className="brutal-card rounded-xl p-5 flex items-center justify-between bg-white hover:shadow-[5px_5px_0px_theme(--color-brutal-shadow)] transition-shadow">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar className="h-12 w-12 border-2 border-brutal-border">
          <AvatarImage src={member.userId.avatarUrl} alt={member.userId.name} />
          <AvatarFallback className="bg-brand-peach text-base font-bold">
            {member.userId.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold font-display truncate">
              {member.userId.name}
            </span>
            {member.role === "owner" && isOwner && (
              <span className="text-xs text-muted-foreground">(You)</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate block">
            {member.userId.email}
          </span>
          {member.joinedAt && (
            <span className="text-xs text-muted-foreground mt-1 block">
              Joined{" "}
              {new Date(member.joinedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <RoleBadge role={member.role} />
      </div>

      {member.role !== "owner" && (
        <div className="ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:bg-brand-blue/10"
                aria-label="Member actions"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="brutal-card w-44">
              <DropdownMenuItem
                disabled={member.role === "editor" || updateRole.isPending}
                onClick={() =>
                  updateRole.mutate({
                    userId: member.userId._id,
                    role: "editor",
                  })
                }
              >
                <Shield size={14} className="mr-2" />
                Make Editor
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={member.role === "viewer" || updateRole.isPending}
                onClick={() =>
                  updateRole.mutate({
                    userId: member.userId._id,
                    role: "viewer",
                  })
                }
              >
                <Eye size={14} className="mr-2" />
                Make Viewer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={removeMember.isPending}
                onClick={() => removeMember.mutate(member.userId._id)}
                className="text-brand-coral focus:text-brand-coral"
              >
                <Trash2 size={14} className="mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

function PendingMemberCard({ member }: { member: PopulatedTripMember }) {
  return (
    <div className="brutal-card rounded-xl p-5 flex items-center justify-between bg-white/50 border-dashed">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar className="h-12 w-12 border-2 border-brutal-border border-dashed opacity-60">
          <AvatarFallback className="bg-brand-lemon text-base font-bold">
            <Mail size={20} />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold font-display truncate">
              {member.userId.name || "Pending User"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate block">
            {member.userId.email}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <RoleBadge role={member.role} />
          <Badge className="brutal-badge bg-brand-lemon border-brand-lemon text-[10px] inline-flex items-center gap-1">
            <Clock size={10} />
            Pending
          </Badge>
        </div>
      </div>
    </div>
  );
}

function MembersListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="brutal-card rounded-xl p-5 flex items-center gap-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="brutal-card rounded-xl p-12 text-center bg-white">
      <div className="w-16 h-16 bg-brand-peach rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 shadow-[4px_4px_0px_theme(--color-brutal-shadow)] mx-auto -rotate-3">
        <Users size={32} />
      </div>
      <h3 className="text-xl font-bold font-display mb-2">Just you so far</h3>
      <p className="text-muted-foreground font-body mb-6">
        Invite others to collaborate on this trip together.
      </p>
    </div>
  );
}

export default function MembersContent() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useMembers(params.id);

  if (isLoading) {
    return <MembersListSkeleton />;
  }

  const hasOnlyOwner =
    data?.active?.length === 1 && data.active[0].role === "owner";
  const owner = data?.active?.find((m) => m.role === "owner");

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">
            Trip Members
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage who can access and edit this trip
          </p>
        </div>
        <InviteMemberDialog tripId={params.id} />
      </div>

      {/* Stats */}
      {!hasOnlyOwner && (
        <div className="grid grid-cols-3 gap-4">
          <div className="brutal-card bg-brand-blue p-4 rounded-xl">
            <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1 block">
              Total
            </span>
            <span className="text-2xl font-black font-display">
              {(data?.active?.length || 0) + (data?.pending?.length || 0)}
            </span>
          </div>
          <div className="brutal-card bg-brand-mint p-4 rounded-xl">
            <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1 block">
              Active
            </span>
            <span className="text-2xl font-black font-display">
              {data?.active?.length || 0}
            </span>
          </div>
          <div className="brutal-card bg-brand-lemon p-4 rounded-xl">
            <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1 block">
              Pending
            </span>
            <span className="text-2xl font-black font-display">
              {data?.pending?.length || 0}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasOnlyOwner && data?.pending?.length === 0 && <EmptyState />}

      {/* Active Members */}
      {data?.active && data.active.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={14} />
            Active Members ({data.active.length})
          </h3>
          <div className="space-y-3">
            {data.active.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                tripId={params.id}
                isOwner={member.userId._id === owner?.userId._id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Separator between active and pending sections */}
      {data?.active &&
        data.active.length > 0 &&
        data?.pending &&
        data.pending.length > 0 && <Separator />}

      {/* Pending Invites */}
      {data?.pending && data.pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={14} />
            Pending Invitations ({data.pending.length})
          </h3>
          <div className="space-y-3">
            {data.pending.map((member) => (
              <PendingMemberCard key={member._id} member={member} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-4 flex items-center gap-1">
            <Mail size={12} />
            Invitation links sent to these email addresses
          </p>
        </div>
      )}
    </div>
  );
}
