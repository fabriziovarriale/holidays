/**
 * StatusBadge per LeaveRequest.
 * Valori: PENDING | APPROVED | REJECTED | CANCELLED
 */
const MAP = {
  PENDING:   { cls: 'h-status-pending',   label: 'In attesa' },
  APPROVED:  { cls: 'h-status-approved',  label: 'Approvata' },
  REJECTED:  { cls: 'h-status-rejected',  label: 'Rifiutata' },
  CANCELLED: { cls: 'h-status-cancelled', label: 'Annullata' },
};

export default function StatusBadge({ status }) {
  const { cls, label } = MAP[status] || { cls: '', label: status };
  return (
    <span className={`h-status ${cls}`}>
      <span className="h-status-dot" />
      {label}
    </span>
  );
}
