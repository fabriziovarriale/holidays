/**
 * BalanceRing — anello SVG con tre archi (usati/in attesa/residui).
 * Props: total, used, pending, remaining, size=200
 */
export default function BalanceRing({ total = 26, used = 0, pending = 0, remaining = 26, size = 200 }) {
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const usedPct   = total > 0 ? used / total : 0;
  const pendPct   = total > 0 ? pending / total : 0;
  const remPct    = total > 0 ? remaining / total : 0;

  const seg = (pct) => `${pct * c} ${c}`;
  const rotOffset = -90;
  const rotUsed = 0;
  const rotPend = rotUsed + usedPct * 360;
  const rotRem  = rotPend + pendPct * 360;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="h-balance-ring"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="var(--h-bg-2)" strokeWidth={stroke} />
      {/* used — coral */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="var(--h-coral)" strokeWidth={stroke}
              strokeDasharray={seg(usedPct)}
              transform={`rotate(${rotOffset + rotUsed} ${size/2} ${size/2})`} />
      {/* pending — yellow */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="var(--h-yellow)" strokeWidth={stroke}
              strokeDasharray={seg(pendPct)}
              transform={`rotate(${rotOffset + rotPend} ${size/2} ${size/2})`} />
      {/* remaining — mint */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="var(--h-mint)" strokeWidth={stroke}
              strokeDasharray={seg(remPct)}
              transform={`rotate(${rotOffset + rotRem} ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 - 4} textAnchor="middle"
            fontFamily="Archivo Black" fontSize="42" fill="var(--h-ink)">
        {remaining}
      </text>
      <text x={size/2} y={size/2 + 20} textAnchor="middle"
            fontSize="11" fontWeight="700" letterSpacing="0.08em"
            fill="var(--h-muted)">
        RESIDUI
      </text>
    </svg>
  );
}
