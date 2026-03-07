"use client";

import { useState } from "react";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Send,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Comment } from "shared/types";
import { useUser } from "@clerk/nextjs";

interface CommentsSectionProps {
  tripId: string;
  targetType: "day" | "activity";
  targetId: string;
}

interface PopulatedComment extends Omit<Comment, "authorId"> {
  authorId: {
    _id: string;
    avatarUrl: string;
    name: string;
  };
}

function CommentCard({
  comment,
  tripId,
  targetType,
  targetId,
  currentUserId,
}: {
  comment: PopulatedComment;
  tripId: string;
  targetType: string;
  targetId: string;
  currentUserId?: string;
}) {
  const deleteComment = useDeleteComment(tripId, targetType, targetId);
  const isOwner = currentUserId === comment.authorId._id;

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-brand-cream/50 transition-colors group">
      <Avatar className="h-8 w-8 border-2 border-brutal-border">
        <AvatarImage
          src={comment.authorId.avatarUrl}
          alt={comment.authorId.name}
        />
        <AvatarFallback className="bg-brand-blue text-xs font-bold">
          {comment.authorId.name?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold font-display">
            {comment.authorId.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-muted-foreground italic">
              (edited)
            </span>
          )}
        </div>
        <p className="text-sm text-foreground font-body whitespace-pre-wrap wrap-break-word">
          {comment.body}
        </p>
      </div>

      {isOwner && (
        <Button
          onClick={() => deleteComment.mutate(comment._id)}
          disabled={deleteComment.isPending}
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-brand-coral"
          title="Delete comment"
          aria-label="Delete comment"
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}

export default function CommentsSection({
  tripId,
  targetType,
  targetId,
}: CommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { user } = useUser();
  const { data: comments, isLoading } = useComments(
    tripId,
    targetType,
    targetId,
  );
  const createComment = useCreateComment(tripId, targetType, targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || trimmedComment.length === 0) return;

    createComment.mutate(
      { body: trimmedComment },
      {
        onSuccess: () => {
          setNewComment("");
        },
      },
    );
  };

  const commentCount = comments?.length || 0;

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-start gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-transparent p-0 h-auto w-full"
        type="button"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <MessageCircle size={16} />
        <span className="font-medium">
          {commentCount === 0
            ? "Add a comment"
            : `${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
        </span>
      </Button>

      {isOpen && (
        <div className="mt-3 pl-6 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-1">
              {(comments as unknown as PopulatedComment[]).map((comment) => (
                <CommentCard
                  key={comment._id}
                  comment={comment}
                  tripId={tripId}
                  targetType={targetType}
                  targetId={targetId}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-2">
              No comments yet. Be the first to comment!
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value || "")}
              placeholder="Add a comment..."
              rows={2}
              className="brutal-input text-sm resize-none"
              disabled={createComment.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={
                !newComment || !newComment.trim() || createComment.isPending
              }
              size="icon"
              className="brutal-button bg-brand-blue hover:bg-brand-blue/90 h-10 w-10 shrink-0"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
