import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-base text-muted-foreground">
        This page isn&apos;t saved on your device yet. Open Expenser once while
        online and your expenses will be available offline.
      </p>
    </main>
  );
}
