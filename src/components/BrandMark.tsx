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
    <div className={`${dim} brand-mark shrink-0 ${className}`} aria-hidden="true">
      <span>FH</span>
    </div>
  );
}
