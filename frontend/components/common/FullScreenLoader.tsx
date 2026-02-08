// [AGENT-GENERATED] Default loader text translated to English.
export function FullScreenLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-primary border-t-primary"></div>
        <p className="text-lg text-text-secondary">{message}</p>
      </div>
    </div>
  );
}
