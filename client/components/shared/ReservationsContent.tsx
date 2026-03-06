"use client";

import { useParams } from "next/navigation";
import {
  useReservations,
  useCreateReservation,
  useDeleteReservation,
} from "../../hooks/useReservations";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReservationSchema,
  type CreateReservationPayload,
  reservationTypes,
} from "../../../shared/validations";
import {
  Plus,
  Trash2,
  Plane,
  Hotel,
  Car,
  UtensilsCrossed,
  Ticket,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

const typeIcons: Record<string, React.ReactNode> = {
  flight: <Plane size={18} className="text-brand-blue" />,
  hotel: <Hotel size={18} className="text-brand-peach" />,
  car_rental: <Car size={18} className="text-brand-lemon" />,
  restaurant: <UtensilsCrossed size={18} className="text-brand-mint" />,
  activity: <Ticket size={18} className="text-brand-blue" />,
  other: <MoreHorizontal size={18} className="text-muted-foreground" />,
};

export default function ReservationsContent() {
  const params = useParams<{ id: string }>();
  const { data: reservations, isLoading } = useReservations(params.id);
  const createReservation = useCreateReservation(params.id);
  const deleteReservation = useDeleteReservation(params.id);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateReservationPayload>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: { type: "flight" },
  });

  function onSubmit(data: CreateReservationPayload) {
    createReservation.mutate(data, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="brutal-card rounded-lg p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="brutal-button bg-brand-blue px-4 py-2 rounded-md text-sm inline-flex items-center gap-2 h-auto"
        >
          <Plus size={14} />
          Add Reservation
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="brutal-card rounded-lg p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                {...register("title")}
                placeholder="Reservation title"
                className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none"
              />
              {errors.title && (
                <p className="text-xs text-brand-coral mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none h-auto">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservationTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              {...register("confirmationNumber")}
              placeholder="Confirmation #"
              className="brutal-input w-full px-3 py-2 rounded-md text-sm font-mono focus:outline-none"
            />
            <Input
              {...register("provider")}
              placeholder="Provider (e.g. ANA, Marriott)"
              className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none"
            />
          </div>
          <Textarea
            {...register("notes")}
            rows={2}
            placeholder="Notes (optional)"
            className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none resize-none min-h-[60px]"
          />
          <div className="flex gap-3 justify-end">
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
              disabled={createReservation.isPending}
              className="brutal-button bg-brand-mint px-4 py-2 rounded-md text-sm disabled:opacity-50 h-auto"
            >
              {createReservation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      )}

      {!reservations || reservations.length === 0 ? (
        <div className="brutal-card rounded-xl p-10 text-center hero-grid relative overflow-hidden">
          <div className="absolute top-0 right-4 text-[120px] leading-none opacity-[0.04] font-kanji select-none pointer-events-none">
            旅
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-blue border-2 border-brutal-border shadow-[4px_4px_0px_#1a1a1a] rounded-2xl flex items-center justify-center mb-5 -rotate-3">
              <Plane size={30} strokeWidth={1.5} />
            </div>
            <span className="badge bg-brand-mint mb-4 inline-flex">
              No bookings yet
            </span>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-tight text-[#111] mb-2">
              No reservations
            </h2>
            <p className="text-muted-foreground font-body text-sm max-w-xs mx-auto">
              Track your flights, hotels, and bookings here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => (
            <div
              key={res._id}
              className="brutal-card rounded-lg p-5 flex items-start gap-4"
            >
              <div className="pt-0.5">
                {typeIcons[res.type] || typeIcons.other}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-extrabold font-display uppercase tracking-tight">
                    {res.title}
                  </h3>
                  <span className="brutal-badge bg-brand-lemon rounded-md text-[10px]">
                    {res.type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {res.provider && <span>{res.provider}</span>}
                  {res.confirmationNumber && (
                    <span className="font-mono">#{res.confirmationNumber}</span>
                  )}
                  {res.datetime && (
                    <span>
                      {new Date(res.datetime).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {res.notes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {res.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => deleteReservation.mutate(res._id)}
                className="p-1.5 text-muted-foreground hover:text-brand-coral hover:bg-transparent transition-colors shrink-0 size-auto"
                aria-label="Delete reservation"
                title="Delete reservation"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
