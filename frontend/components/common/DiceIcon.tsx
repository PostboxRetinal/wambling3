export function DiceIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />

      <circle cx="7" cy="7" r="1.2" fill="white" />
      <circle cx="7" cy="12" r="1.2" fill="white" />
      <circle cx="7" cy="17" r="1.2" fill="white" />

      <circle cx="12" cy="12" r="1.2" fill="white" />

      <circle cx="17" cy="7" r="1.2" fill="white" />
      <circle cx="17" cy="12" r="1.2" fill="white" />
      <circle cx="17" cy="17" r="1.2" fill="white" />
    </svg>
  );
}
