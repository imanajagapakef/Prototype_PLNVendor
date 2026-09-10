import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-surface hover:bg-primary-hover",
        secondary: "bg-subtle text-ink hover:bg-line",
        outline: "border border-line bg-surface text-ink hover:bg-hover",
        ghost: "text-ink hover:bg-subtle",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ variant, className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(button({ variant }), className)} {...props} />
  );
}
