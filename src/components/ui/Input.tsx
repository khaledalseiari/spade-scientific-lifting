import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
        "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
