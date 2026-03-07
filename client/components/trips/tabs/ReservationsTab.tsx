"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin, MoreHorizontal, Plus } from "lucide-react";
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
import { brutalBtnSm } from "./_shared";
import {
  useReservations,
  useCreateReservation,
  useDeleteReservation,
} from "@/hooks/useReservations";
import type { Reservation } from "shared/types";
import { reservationTypes, reservationStatuses } from "shared/validations";

const resTypeColor: Record<string, string> = {
  flight: "bg-brand-blue",
  hotel: "bg-brand-peach",
  car_rental: "bg-brand-mint",
  restaurant: "bg-brand-lemon",
  activity: "bg-brand-lemon",
  other: "bg-[#e5e7eb]",
};

export function ReservationsTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: reservations = [], isLoading } = useReservations(tripId);
  const createReservation = useCreateReservation(tripId);
  const deleteReservation = useDeleteReservation(tripId);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<{
    type: string;
    title: string;
    confirmationNumber: string;
    provider: string;
    datetime: string;
    notes: string;
    status: string;
  }>({
    type: "flight",
    title: "",
    confirmationNumber: "",
    provider: "",
    datetime: "",
    notes: "",
    status: "confirmed",
  });

  function submitAdd() {
    createReservation.mutate(
      {
        type: form.type as Reservation["type"],
        title: form.title,
        confirmationNumber: form.confirmationNumber || undefined,
        provider: form.provider || undefined,
        datetime: form.datetime
          ? new Date(form.datetime).toISOString()
          : undefined,
        notes: form.notes || undefined,
        status: form.status as Reservation["status"],
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setForm({
            type: "flight",
            title: "",
            confirmationNumber: "",
            provider: "",
            datetime: "",
            notes: "",
            status: "confirmed",
          });
        },
      },
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-base">
          {reservations.length}{" "}
          {reservations.length === 1 ? "reservation" : "reservations"}
        </p>
        {canEdit && (
          <Button
            size="sm"
            className={cn(brutalBtnSm, "gap-1")}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={12} />
            Add
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white border-2 border-[#1A1A1A] rounded-xl animate-pulse"
              />
            ))
          : reservations.map((res) => (
              <div
                key={res._id}
                className="group flex items-center gap-4 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center shrink-0",
                    resTypeColor[res.type] ?? "bg-brand-lemon",
                  )}
                >
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{res.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {res.datetime && (
                      <span className="text-[11px] text-[#9CA3AF] font-medium">
                        {format(new Date(res.datetime), "MMM d")}
                      </span>
                    )}
                    {res.confirmationNumber && (
                      <code className="text-[10px] bg-brand-cream border border-[#e5e7eb] px-1.5 py-0.5 rounded font-mono text-[#6B7280]">
                        {res.confirmationNumber}
                      </code>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {res.status && (
                    <Badge
                      className={cn(
                        "border text-[11px] font-bold px-2 py-0.5 rounded-full",
                        res.status === "confirmed"
                          ? "bg-brand-mint border-[#1A1A1A] text-[#111]"
                          : "bg-brand-lemon border-[#1A1A1A] text-[#111]",
                      )}
                    >
                      {res.status}
                    </Badge>
                  )}
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 border border-transparent hover:border-[#1A1A1A] rounded transition-all"
                        >
                          <MoreHorizontal size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
                      >
                        <DropdownMenuItem
                          className="text-xs font-medium text-red-600 cursor-pointer"
                          onSelect={() => deleteReservation.mutate(res._id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

        {!isLoading && !reservations.length && (
          <p className="text-sm text-[#9CA3AF] font-medium text-center py-12">
            No reservations yet.
          </p>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Add Reservation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Type
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                  {reservationTypes.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      className="capitalize text-sm"
                    >
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Title *
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="e.g. ANA Flight NH820"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Confirmation #
              </Label>
              <Input
                value={form.confirmationNumber}
                onChange={(e) =>
                  setForm({ ...form, confirmationNumber: e.target.value })
                }
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Provider
              </Label>
              <Input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Date & Time
              </Label>
              <input
                type="datetime-local"
                value={form.datetime}
                onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                className="mt-1 w-full h-10 px-3 border-2 border-[#1A1A1A] rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Notes
              </Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                  {reservationStatuses.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="capitalize text-sm"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!form.title.trim() || createReservation.isPending}
              onClick={submitAdd}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 rounded-lg"
            >
              {createReservation.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
