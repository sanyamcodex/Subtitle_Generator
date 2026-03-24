import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-white text-black hover:scale-[1.02] hover:shadow-lg",
        variant === "secondary" &&
          "border border-white/15 bg-white/10 text-white hover:bg-white/15",
        variant === "ghost" &&
          "bg-transparent text-white/80 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    />
  );
}