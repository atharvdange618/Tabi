"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Circle, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { brutalBtnSm } from "./_shared";
import {
  useChecklists,
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
} from "@/hooks/useChecklists";
import type { Checklist, ChecklistItem } from "shared/types";

type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

function ChecklistCard({
  cl,
  tripId,
  canEdit,
}: {
  cl: ChecklistWithItems;
  tripId: string;
  canEdit: boolean;
}) {
  const toggleItem = useUpdateChecklistItem(tripId);
  const createItem = useCreateChecklistItem(tripId);
  const updateChecklist = useUpdateChecklist(tripId);
  const deleteChecklist = useDeleteChecklist(tripId);

  const [addingItem, setAddingItem] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(cl.title);
  const itemInputRef = useRef<HTMLInputElement>(null);

  const done = cl.items.filter((i) => i.isChecked).length;
  const total = cl.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleAddItem() {
    if (!newLabel.trim()) return;
    createItem.mutate(
      { clId: cl._id, payload: { label: newLabel.trim() } },
      {
        onSuccess: () => {
          setNewLabel("");
          setAddingItem(false);
        },
      },
    );
  }

  function handleRename() {
    updateChecklist.mutate(
      { clId: cl._id, payload: { title: renameTitle } },
      { onSuccess: () => setRenameOpen(false) },
    );
  }

  return (
    <>
      <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#1A1A1A] bg-brand-cream">
          <div>
            <p className="font-display font-bold text-sm">{cl.title}</p>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">
              {done}/{total} done
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center text-[11px] font-black">
              {pct}%
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 border border-transparent hover:border-[#1A1A1A] rounded"
                  >
                    <MoreHorizontal size={13} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
                >
                  <DropdownMenuItem
                    className="text-xs font-medium cursor-pointer"
                    onSelect={() => {
                      setRenameTitle(cl.title);
                      setRenameOpen(true);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs font-medium text-red-600 cursor-pointer"
                    onSelect={() => deleteChecklist.mutate(cl._id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="h-1.5 bg-[#e5e7eb]">
          <div
            className="h-full bg-brand-mint border-r border-[#1A1A1A] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-4 space-y-1">
          {cl.items.map((item) => (
            <button
              key={item._id}
              onClick={
                canEdit
                  ? () =>
                      toggleItem.mutate({
                        clId: cl._id,
                        itemId: item._id,
                        payload: { isChecked: !item.isChecked },
                      })
                  : undefined
              }
              className={cn(
                "w-full flex items-center gap-3 text-left rounded-lg px-2 py-1.5 transition-colors group/item",
                canEdit
                  ? "hover:bg-brand-cream cursor-pointer"
                  : "cursor-default",
              )}
            >
              {item.isChecked ? (
                <CheckCircle2 size={16} className="text-[#111] shrink-0" />
              ) : (
                <Circle
                  size={16}
                  className="text-[#d1d5db] group-hover/item:text-[#9CA3AF] shrink-0 transition-colors"
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  item.isChecked
                    ? "line-through text-[#9CA3AF]"
                    : "text-[#111]",
                )}
              >
                {item.label}
              </span>
            </button>
          ))}

          {canEdit && addingItem ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <input
                ref={itemInputRef}
                autoFocus
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                  if (e.key === "Escape") {
                    setAddingItem(false);
                    setNewLabel("");
                  }
                }}
                className="flex-1 text-sm border-b-2 border-[#1A1A1A] bg-transparent outline-none py-0.5"
                placeholder="New item…"
              />
              <Button
                size="sm"
                className="h-6 px-2 text-xs font-bold bg-brand-blue text-[#111] border border-[#1A1A1A] rounded-md hover:bg-brand-blue"
                onClick={handleAddItem}
                disabled={createItem.isPending}
              >
                Add
              </Button>
              <button
                onClick={() => {
                  setAddingItem(false);
                  setNewLabel("");
                }}
                className="text-xs text-[#9CA3AF] hover:text-[#6B7280]"
              >
                ✕
              </button>
            </div>
          ) : (
            canEdit && (
              <button
                onClick={() => {
                  setAddingItem(true);
                  setTimeout(() => itemInputRef.current?.focus(), 50);
                }}
                className="w-full flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] hover:text-[#6B7280] px-2 py-1.5 transition-colors"
              >
                <Plus size={12} />
                Add item
              </button>
            )
          )}
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Rename Checklist
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Title
            </Label>
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!renameTitle.trim() || updateChecklist.isPending}
              onClick={handleRename}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all rounded-lg"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export function ChecklistsTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: checklists = [], isLoading } = useChecklists(tripId);
  const createChecklist = useCreateChecklist(tripId);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function handleCreate() {
    createChecklist.mutate(
      { title: newTitle.trim() },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewTitle("");
        },
      },
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="font-display font-bold text-base">
          {checklists.length}{" "}
          {checklists.length === 1 ? "checklist" : "checklists"}
        </p>
        {canEdit && (
          <Button
            size="sm"
            className={cn(brutalBtnSm, "gap-1")}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={12} />
            Add checklist
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 bg-white border-2 border-[#1A1A1A] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : checklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-display font-black text-xl uppercase text-[#9CA3AF]">
            No checklists yet
          </p>
          {canEdit && (
            <Button
              className={cn(brutalBtnSm, "gap-1 mt-4")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={12} />
              Create one
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {(checklists as ChecklistWithItems[]).map((cl) => (
            <ChecklistCard
              key={cl._id}
              cl={cl}
              tripId={tripId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              New Checklist
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Title *
            </Label>
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              placeholder="e.g. Packing List"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!newTitle.trim() || createChecklist.isPending}
              onClick={handleCreate}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all rounded-lg"
            >
              {createChecklist.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
