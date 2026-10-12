import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-white/5 px-3 text-base text-white outline-none placeholder:text-white/35 focus-visible:border-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
