import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export function UnauthorizedPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <h2 className="text-xl font-bold">Please sign in</h2>
      <p className="mt-2 text-base text-muted-foreground">
        Your session is missing or has expired.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link href="/signin" className={buttonClass("primary", "md")}>
          Sign in
        </Link>
        <Link href="/signup" className={buttonClass("secondary", "md")}>
          Create account
        </Link>
      </div>
    </div>
  );
}
