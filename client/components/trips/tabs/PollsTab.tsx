"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Trophy, Check, Vote, Lock } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  usePolls,
  useCreatePoll,
  useVotePoll,
  useClosePoll,
  useDeletePoll,
} from "@/hooks/usePolls";
import { useMembers } from "@/hooks/useMembers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Poll } from "shared/types";

function PollCard({
  poll,
  currentUserId,
  canEdit,
  onVote,
  onClose,
  onDelete,
  isVoting,
}: {
  poll: Poll;
  currentUserId?: string;
  canEdit: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onClose: (pollId: string, winningOptionId: string) => void;
  onDelete: (pollId: string) => void;
  isVoting: boolean;
}) {
  const [closingMode, setClosingMode] = useState(false);

  const isOpen = poll.status === "open";
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const topOption = poll.options.reduce(
    (best, o) => (o.votes.length > best.votes.length ? o : best),
    poll.options[0],
  );

  return (
    <div
      className={cn(
        "bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]",
        !isOpen && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!isOpen && <Lock size={13} className="text-[#9CA3AF] shrink-0" />}
            <p className="font-display font-bold text-base leading-tight">
              {poll.question}
            </p>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} ·{" "}
            {poll.options.length} options
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => onDelete(poll._id)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-[#9CA3AF]"
            title="Delete poll"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const pct =
            totalVotes > 0
              ? Math.round((option.votes.length / totalVotes) * 100)
              : 0;
          const isMyVote = currentUserId
            ? option.votes.includes(currentUserId)
            : false;
          const isWinner = !isOpen && poll.winningOptionId === option._id;

          return (
            <button
              key={option._id}
              disabled={!isOpen || isVoting}
              onClick={() => isOpen && onVote(poll._id, option._id)}
              className={cn(
                "w-full text-left relative rounded-lg border-2 overflow-hidden transition-all",
                isOpen && !isVoting
                  ? "hover:border-[#1A1A1A] cursor-pointer"
                  : "cursor-default",
                isMyVote
                  ? "border-[#1A1A1A]"
                  : isWinner
                    ? "border-brand-mint"
                    : "border-[#1A1A1A]/15",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isMyVote
                    ? "bg-brand-blue/25"
                    : isWinner
                      ? "bg-brand-mint/25"
                      : "bg-[#f0f0ec]",
                )}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-medium">{option.text}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {pct}%
                  </span>
                  {isMyVote && <Check size={13} className="text-[#1A1A1A]" />}
                  {isWinner && (
                    <Trophy
                      size={13}
                      className="text-amber-600 fill-amber-400"
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isOpen && canEdit && !closingMode && (
        <button
          onClick={() => setClosingMode(true)}
          className="mt-3 text-xs font-bold text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
        >
          Declare winner &amp; end poll →
        </button>
      )}

      {isOpen && canEdit && closingMode && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-8 flex items-center gap-1.5 px-3 rounded-lg border-2 border-[#1A1A1A]/15 bg-[#f8f8f6] text-xs text-[#6B7280]">
            <Trophy
              size={11}
              className="text-amber-500 fill-amber-300 shrink-0"
            />
            <span className="truncate font-medium text-[#1A1A1A]">
              {topOption?.text}
            </span>
            <span className="shrink-0">wins</span>
          </div>
          <button
            onClick={() => {
              onClose(poll._id, topOption._id);
              setClosingMode(false);
            }}
            className="h-8 px-3 text-xs font-bold bg-[#1A1A1A] text-white rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
          >
            End
          </button>
          <button
            onClick={() => setClosingMode(false)}
            className="h-8 px-3 text-xs font-bold border-2 border-[#1A1A1A]/20 rounded-lg hover:border-[#1A1A1A] transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export function PollsTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { user: clerkUser } = useUser();
  const { data: polls = [], isPending } = usePolls(tripId);
  const { data: membersData } = useMembers(tripId);

  const activeMembers = membersData?.active ?? [];
  const currentUserMember = activeMembers.find(
    (m) => m.userId?.email === clerkUser?.emailAddresses[0]?.emailAddress,
  );
  const currentUserId = currentUserMember?.userId?._id;

  const createPoll = useCreatePoll(tripId);
  const votePoll = useVotePoll(tripId);
  const closePoll = useClosePoll(tripId);
  const deletePoll = useDeletePoll(tripId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const openPolls = useMemo(
    () => polls.filter((p) => p.status === "open"),
    [polls],
  );
  const closedPolls = useMemo(
    () => polls.filter((p) => p.status === "closed"),
    [polls],
  );

  function handleAddOption() {
    if (options.length < 10) setOptions([...options, ""]);
  }

  function handleRemoveOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }

  function handleOptionChange(i: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function handleCreatePoll() {
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (!question.trim() || validOptions.length < 2) return;
    createPoll.mutate(
      { question: question.trim(), options: validOptions },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setQuestion("");
          setOptions(["", ""]);
        },
      },
    );
  }

  function handleVote(pollId: string, optionId: string) {
    votePoll.mutate({ pollId, optionId });
  }

  function handleClose(pollId: string, winningOptionId: string) {
    closePoll.mutate({ pollId, winningOptionId });
  }

  function handleDelete(pollId: string) {
    deletePoll.mutate(pollId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-xl uppercase tracking-tight">
            Polls
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Vote on group decisions
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-bold border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all bg-brand-lemon"
          >
            <Plus size={15} />
            New Poll
          </button>
        )}
      </div>

      {isPending && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A] space-y-3"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!isPending && polls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-brand-lemon border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center mb-4 shadow-[4px_4px_0px_#1A1A1A]">
            <Vote size={24} />
          </div>
          <h3 className="font-display font-black text-lg mb-1">No polls yet</h3>
          <p className="text-sm text-[#6B7280] max-w-xs">
            {canEdit
              ? "Create a poll to get the group to vote on decisions."
              : "No polls have been created for this trip yet."}
          </p>
        </div>
      )}

      {!isPending && openPolls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            Open
          </h3>
          {openPolls.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              currentUserId={currentUserId}
              canEdit={canEdit}
              onVote={handleVote}
              onClose={handleClose}
              onDelete={handleDelete}
              isVoting={votePoll.isPending}
            />
          ))}
        </div>
      )}

      {!isPending && closedPolls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            Closed
          </h3>
          {closedPolls.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              currentUserId={currentUserId}
              canEdit={canEdit}
              onVote={handleVote}
              onClose={handleClose}
              onDelete={handleDelete}
              isVoting={false}
            />
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl">
              New Poll
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Question</Label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Which restaurant should we visit on Day 2?"
                maxLength={500}
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">
                Options
                <span className="ml-1 text-[#9CA3AF] font-normal">
                  ({options.length}/10)
                </span>
              </Label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={200}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(i)}
                        className="px-2 text-[#9CA3AF] hover:text-red-500 transition-colors"
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    onClick={handleAddOption}
                    type="button"
                    className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  >
                    <Plus size={12} />
                    Add option
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => {
                setCreateDialogOpen(false);
                setQuestion("");
                setOptions(["", ""]);
              }}
              className="px-4 py-2 text-sm font-bold border-2 border-[#1A1A1A]/20 rounded-xl hover:border-[#1A1A1A] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePoll}
              disabled={
                !question.trim() ||
                options.filter((o) => o.trim()).length < 2 ||
                createPoll.isPending
              }
              className="px-4 py-2 text-sm font-bold bg-[#1A1A1A] text-white rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {createPoll.isPending ? "Creating…" : "Create Poll"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
