import { cn } from "@/lib/utils";

/** Shared look for every text input / select / date field. */
export const inputClass =
  "block h-12 w-full rounded-xl border-2 border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Inline status line (success / error / info) with a text cue, not just color. */
export function Notice({
  tone,
  children,
  className,
}: {
  tone: "success" | "error" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    success: "border-success/30 bg-success-soft text-success",
    error: "border-destructive/30 bg-destructive-soft text-destructive",
    warning: "border-warning/30 bg-warning-soft text-warning",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </p>
  );
}
