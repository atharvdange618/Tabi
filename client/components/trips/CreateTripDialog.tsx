"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateTripForm from "./CreateTripForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CreateTripDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateTripDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: CreateTripDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="brutal-button bg-brand-blue hover:bg-brand-lemon">
            <Plus size={20} strokeWidth={2.5} />
            Create Trip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="brutal-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-blue rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_theme(--color-brutal-shadow)] flex items-center justify-center -rotate-3">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-2xl font-bold font-display">
              Create a New Trip
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-body">
            Start planning your next adventure. Fill in the details below to
            create your trip.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <CreateTripForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
