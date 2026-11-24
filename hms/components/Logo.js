// Brand mark: a white medical plus on a red tile.
// tile={false} draws just the plus in the given color.
export default function Logo({ size = 32, tile = true, color = "var(--color-brand)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Z's HMS" role="img">
      {tile && <rect width="32" height="32" rx="7" fill={color} />}
      <path d="M13 6.5h6v6.5h6.5v6H19v6.5h-6V19H6.5v-6H13z" fill={tile ? "#FFFFFF" : color} />
    </svg>
  );
}
