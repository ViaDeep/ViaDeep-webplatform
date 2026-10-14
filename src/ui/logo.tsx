/** Isotipo de ViaDeep (el mismo de la app móvil): una vía en perspectiva sobre fondo azul marino. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label="ViaDeep">
      <rect width="36" height="36" rx="6" fill="#0f2042" />
      <path d="M8 29 L15 8" stroke="#2F8CFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M28 29 L21 8" stroke="#2F8CFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13 10 H23" stroke="#4EDEA3" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="18" y1="14" x2="18" y2="29" stroke="#4EDEA3" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}
