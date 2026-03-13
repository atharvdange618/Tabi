"use client";

import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentReaction } from "shared/types";

interface EmojiReactionPickerProps {
  reactions: CommentReaction[];
  currentUserId?: string;
  onToggle: (emoji: string) => void;
  disabled?: boolean;
}

const PICKER_HEIGHT = 435;
const PICKER_WIDTH = 352;

function EmojiPickerPopover({
  onSelect,
  disabled,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  }>({ vertical: "top", horizontal: "left" });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function handleOpen() {
    if (!buttonRef.current) {
      setOpen((v) => !v);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;

    setPosition({
      vertical:
        spaceAbove >= PICKER_HEIGHT || spaceAbove > spaceBelow
          ? "top"
          : "bottom",
      horizontal: spaceRight >= PICKER_WIDTH ? "left" : "right",
    });
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open || !pickerRef.current) return;
    pickerRef.current.innerHTML = "";

    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: { native: string }) => {
        onSelect(emoji.native);
        setOpen(false);
      },
      theme: "light",
      previewPosition: "none",
      skinTonePosition: "none",
      maxFrequentRows: 1,
    });

    pickerRef.current.appendChild(picker as unknown as Node);
  }, [open, onSelect]);

  const positionClasses = [
    position.vertical === "top" ? "bottom-full mb-1" : "top-full mt-1",
    position.horizontal === "left" ? "left-0" : "right-0",
  ].join(" ");

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="flex items-center gap-0.5 h-6 px-1.5 rounded-full border border-dashed border-[#d1d5db] text-[#9CA3AF] hover:border-[#1A1A1A] hover:text-[#6B7280] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add reaction"
      >
        <SmilePlus size={13} />
      </button>

      {open && (
        <div
          ref={pickerRef}
          className={`absolute ${positionClasses} z-50 shadow-[6px_6px_0px_#1A1A1A] rounded-2xl overflow-hidden border-2 border-[#1A1A1A]`}
          style={
            {
              "--em-color-border": "transparent",
              "--em-color-border-over": "transparent",
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}

export default function EmojiReactionPicker({
  reactions,
  currentUserId,
  onToggle,
  disabled,
}: EmojiReactionPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {reactions.map((r) => {
        const hasReacted = !!currentUserId && r.users.includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(r.emoji)}
            className={cn(
              "flex items-center gap-1 h-6 px-2 rounded-full border text-xs font-semibold transition-all",
              hasReacted
                ? "border-[#1A1A1A] bg-brand-blue shadow-[2px_2px_0px_#1A1A1A]"
                : "border-[#e5e7eb] bg-white hover:border-[#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A]",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            title={`${r.users.length} reaction${r.users.length !== 1 ? "s" : ""}`}
          >
            <span>{r.emoji}</span>
            <span className="text-[10px] font-bold">{r.users.length}</span>
          </button>
        );
      })}

      {reactions.length < 6 && (
        <EmojiPickerPopover onSelect={onToggle} disabled={disabled} />
      )}
    </div>
  );
}
