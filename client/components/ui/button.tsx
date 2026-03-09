"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-brutal-border shadow-[3px_3px_0px_#1a1a1a] hover:-translate-y-px hover:shadow-[4px_4px_0px_#1a1a1a] active:translate-y-px active:shadow-[1px_1px_0px_#1a1a1a] transition-all",
        destructive:
          "bg-destructive text-white border-2 border-brutal-border shadow-[3px_3px_0px_#1a1a1a] hover:-translate-y-px hover:shadow-[4px_4px_0px_#1a1a1a] active:translate-y-px active:shadow-[1px_1px_0px_#1a1a1a] transition-all focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-brutal-border bg-background shadow-[3px_3px_0px_#1a1a1a] hover:bg-accent hover:text-accent-foreground hover:-translate-y-px hover:shadow-[4px_4px_0px_#1a1a1a] transition-all",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-brutal-border shadow-[3px_3px_0px_#1a1a1a] hover:-translate-y-px hover:shadow-[4px_4px_0px_#1a1a1a] active:translate-y-px active:shadow-[1px_1px_0px_#1a1a1a] transition-all",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={(e) => {
        haptic();
        onClick?.(e);
      }}
      {...props}
    />
  );
}

export { Button, buttonVariants };
