/**
 * StatCard — numero grande + label + background colore semantico opzionale.
 */
export default function StatCard({ label, value, hint, tone, className = '' }) {
  const bg = {
    coral:  'var(--h-coral)',
    yellow: 'var(--h-yellow)',
    mint:   'var(--h-mint)',
    rose:   'var(--h-rose)',
    sky:    'var(--h-sky)',
    ink:    'var(--h-ink)',
  }[tone];

  const color = tone === 'ink' ? 'var(--h-bg)' : 'var(--h-ink)';

  return (
    <div
      className={`h-card ${className}`}
      style={{ padding: 18, background: bg, color }}
    >
      <div className="h-label" style={{ opacity: 0.8 }}>{label}</div>
      <div className="h-display" style={{ fontSize: 44, marginTop: 6 }}>{value}</div>
      {hint ? (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{hint}</div>
      ) : null}
    </div>
  );
}
