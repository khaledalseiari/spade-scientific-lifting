import { cn } from "@/lib/utils";

type Variant = "neutral" | "support" | "highlight" | "danger";

// All light backgrounds pair with dark (brand-ink) text — verified in BRAND.md.
const variantClasses: Record<Variant, string> = {
  neutral: "bg-gray-100 text-gray-700",
  support: "bg-brand-support text-brand-ink",
  highlight: "bg-brand-highlight text-brand-ink",
  danger: "bg-red-100 text-red-800",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
