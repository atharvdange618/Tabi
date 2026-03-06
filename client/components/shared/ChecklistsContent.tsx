"use client";

import { useParams } from "next/navigation";
import {
  useChecklists,
  useCreateChecklist,
  useDeleteChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from "../../hooks/useChecklists";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createChecklistSchema,
  createChecklistItemSchema,
  type CreateChecklistPayload,
  type CreateChecklistItemPayload,
} from "shared/validations";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import type { ChecklistItem } from "shared/types";

function ChecklistItemRow({
  item,
  tripId,
  clId,
}: {
  item: ChecklistItem;
  tripId: string;
  clId: string;
}) {
  const updateItem = useUpdateChecklistItem(tripId);
  const deleteItem = useDeleteChecklistItem(tripId);

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <Checkbox
        checked={item.isChecked}
        onCheckedChange={(checked) =>
          updateItem.mutate({
            clId,
            itemId: item._id,
            payload: { isChecked: !!checked },
          })
        }
        className="data-[state=checked]:bg-brand-mint data-[state=checked]:border-brand-mint"
        aria-label={`Toggle: ${item.label}`}
      />
      <span
        className={`text-sm font-body flex-1 ${item.isChecked ? "line-through text-muted-foreground" : ""}`}
      >
        {item.label}
      </span>
      <Button
        variant="ghost"
        onClick={() => deleteItem.mutate({ clId, itemId: item._id })}
        className="p-1 text-muted-foreground hover:text-brand-coral hover:bg-transparent opacity-0 group-hover:opacity-100 transition-all h-auto size-auto"
        aria-label="Delete item"
        title="Delete item"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  );
}

function AddItemInput({ tripId, clId }: { tripId: string; clId: string }) {
  const createItem = useCreateChecklistItem(tripId);
  const { register, handleSubmit, reset } = useForm<CreateChecklistItemPayload>(
    {
      resolver: zodResolver(createChecklistItemSchema),
    },
  );

  function onSubmit(data: CreateChecklistItemPayload) {
    createItem.mutate({ clId, payload: data }, { onSuccess: () => reset() });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-2 mt-2"
    >
      <Input
        {...register("label")}
        placeholder="Add item..."
        className="brutal-input flex-1 px-3 py-1.5 rounded-md text-sm font-body focus:outline-none"
      />
      <Button
        type="submit"
        disabled={createItem.isPending}
        className="brutal-button bg-brand-mint px-3 py-1.5 rounded-md text-xs h-auto"
      >
        <Plus size={12} />
      </Button>
    </form>
  );
}

export default function ChecklistsContent() {
  const params = useParams<{ id: string }>();
  const { data: checklists, isLoading } = useChecklists(params.id);
  const createChecklist = useCreateChecklist(params.id);
  const deleteChecklist = useDeleteChecklist(params.id);
  const [showForm, setShowForm] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChecklistPayload>({
    resolver: zodResolver(createChecklistSchema),
  });

  function onCreateChecklist(data: CreateChecklistPayload) {
    createChecklist.mutate(data, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="brutal-card rounded-lg p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Switch
            id="hide-completed"
            checked={hideCompleted}
            onCheckedChange={setHideCompleted}
          />
          <Label
            htmlFor="hide-completed"
            className="text-sm font-body text-muted-foreground cursor-pointer select-none"
          >
            Hide completed
          </Label>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="brutal-button bg-brand-blue px-4 py-2 rounded-md text-sm inline-flex items-center gap-2 h-auto"
        >
          <Plus size={14} />
          New Checklist
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreateChecklist)}
          className="brutal-card rounded-lg p-4 mb-6 flex gap-3"
        >
          <div className="flex-1">
            <Input
              {...register("title")}
              placeholder="Checklist title"
              className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none"
            />
            {errors.title && (
              <p className="text-xs text-brand-coral mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm text-muted-foreground hover:bg-transparent p-0 h-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createChecklist.isPending}
            className="brutal-button bg-brand-mint px-4 py-2 rounded-md text-sm h-auto"
          >
            Create
          </Button>
        </form>
      )}

      {!checklists || checklists.length === 0 ? (
        <div className="brutal-card rounded-xl p-10 text-center hero-grid relative overflow-hidden">
          <div className="absolute top-0 right-4 text-[120px] leading-none opacity-[0.04] font-kanji select-none pointer-events-none">
            旅
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-mint border-2 border-brutal-border shadow-[4px_4px_0px_#1a1a1a] rounded-2xl flex items-center justify-center mb-5 rotate-2">
              <Plus size={30} strokeWidth={2} />
            </div>
            <span className="badge bg-brand-lemon mb-4 inline-flex">
              Nothing here yet
            </span>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-tight text-[#111] mb-2">
              No checklists
            </h2>
            <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
              Create a checklist to start tracking tasks and packing essentials.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {checklists.map((cl) => (
            <div key={cl._id} className="brutal-card rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold font-display uppercase tracking-tight">
                  {cl.title}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => deleteChecklist.mutate(cl._id)}
                  className="p-1.5 text-muted-foreground hover:text-brand-coral hover:bg-transparent transition-colors h-auto size-auto"
                  aria-label="Delete checklist"
                  title="Delete checklist"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div>
                {cl.items && cl.items.length > 0 ? (
                  cl.items
                    .filter((item) => (hideCompleted ? !item.isChecked : true))
                    .map((item) => (
                      <ChecklistItemRow
                        key={item._id}
                        item={item}
                        tripId={params.id}
                        clId={cl._id}
                      />
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground font-body">
                    No items yet. Add your first task.
                  </p>
                )}
              </div>
              <AddItemInput tripId={params.id} clId={cl._id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
