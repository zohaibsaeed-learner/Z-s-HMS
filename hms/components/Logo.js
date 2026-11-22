export default function Logo({ size = 40, color = "#C8102E" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Red Crescent">
      <path d="M45.27 12 A24 24 0 1 0 45.27 52 A22 22 0 0 1 45.27 12 Z" fill={color} />
    </svg>
  );
}