export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      className="cmap-spinner"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  );
}
