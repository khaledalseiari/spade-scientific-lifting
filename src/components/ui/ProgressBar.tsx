import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex justify-between text-xs font-medium text-gray-600">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-highlight transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
