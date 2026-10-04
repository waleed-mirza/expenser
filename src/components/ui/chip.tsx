import { cn } from "@/lib/utils";

export const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:bg-muted"
  );

/** Toggle-style pill used for quick filters, note suggestions and presets. */
export function Chip({
  active = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(chipClass(active), className)}
      {...props}
    />
  );
}
