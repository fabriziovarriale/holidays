/**
 * Tag colorato per tipo di assenza.
 * Valori: FERIE | PERMESSO | MALATTIA | ROL
 */
const MAP = {
  FERIE:    'h-tag-ferie',
  PERMESSO: 'h-tag-permesso',
  MALATTIA: 'h-tag-malattia',
  ROL:      'h-tag-rol',
};

export default function LeaveTypeTag({ code }) {
  return <span className={`h-tag ${MAP[code] || ''}`}>{code}</span>;
}
