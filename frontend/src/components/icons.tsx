export function Logo() {
  return (
    <span className="grid size-8 place-items-center rounded-full bg-blush-soft">
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6v4M8 3v10" className="stroke-aqua" />
        <path d="M12 5v6" className="stroke-blush" />
      </svg>
    </span>
  );
}

export function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
