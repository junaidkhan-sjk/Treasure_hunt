export function BrandMark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "h-9 w-9 text-[0.7rem]"
      : size === "lg"
        ? "h-12 w-12 text-sm"
        : "h-11 w-11 text-xs";

  return (
    <div className={`${dim} brand-mark shrink-0 ${className} !bg-[var(--color-bg-neo)] !border-none shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]`} aria-hidden="true">
      <span className="text-cyan-600 font-black">FH</span>
    </div>
  );
}
