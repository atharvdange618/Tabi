"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBudgetSettingsSchema,
  type UpdateBudgetSettingsPayload,
} from "shared/validations";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  useBudgetSettings,
  useUpdateBudgetSettings,
} from "../../hooks/useBudget";

export function BudgetSettingsCard({ tripId }: { tripId: string }) {
  const { data: settings } = useBudgetSettings(tripId);
  const updateSettings = useUpdateBudgetSettings(tripId);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateBudgetSettingsPayload>({
    resolver: zodResolver(updateBudgetSettingsSchema),
    values: { totalBudget: settings?.totalBudget ?? 0 },
  });

  function onSubmit(data: UpdateBudgetSettingsPayload) {
    updateSettings.mutate(data, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className="brutal-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold font-display uppercase tracking-tight flex items-center gap-2">
          <Wallet size={16} />
          Budget Settings
        </h3>
        {!editing && (
          <Button
            variant="ghost"
            onClick={() => setEditing(true)}
            className="text-xs text-brand-blue hover:underline hover:bg-transparent h-auto p-0"
          >
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center gap-3"
        >
          <Input
            type="number"
            inputMode="decimal"
            {...register("totalBudget", { valueAsNumber: true })}
            className="brutal-input px-3 py-2 rounded-md text-sm font-body w-40 focus:outline-none"
          />
          <span className="text-sm text-muted-foreground font-mono">INR</span>
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            className="brutal-button bg-brand-mint px-3 py-1.5 rounded-md text-xs h-auto"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-muted-foreground hover:bg-transparent h-auto p-0"
          >
            Cancel
          </Button>
          {errors.totalBudget && (
            <p className="text-xs text-brand-coral">
              {errors.totalBudget.message}
            </p>
          )}
        </form>
      ) : (
        <p className="text-2xl font-bold font-display">
          ₹{(settings?.totalBudget ?? 0).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}
