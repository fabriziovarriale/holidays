import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import StatusBadge from '@/Components/h/StatusBadge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Slideover from '@/Components/Slideover';
import { fmtDate, fmtDateTime, fmtPeriodIT } from '@/lib/date';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function initialsOf(fullName) {
    if (!fullName) return '—';
    const parts = fullName.trim().split(/\s+/);
    const a = (parts[0]?.[0] || '').toUpperCase();
    const b = (parts[1]?.[0] || '').toUpperCase();
    return (a + b) || '—';
}

function DetailRow({ label, value }) {
    return (
        <div
            className="h-grid-responsive"
            style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: 10,
                padding: '8px 0',
                borderBottom: '2px dashed var(--h-line)',
            }}
        >
            <div className="h-label">{label}</div>
            <div style={{ fontSize: 13 }}>{value}</div>
        </div>
    );
}

function TimelineStep({ done, pending, error, label, when }) {
    return (
        <li style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
                style={{
                    width: 20,
                    height: 20,
                    border: '2.5px solid var(--h-line)',
                    borderRadius: '50%',
                    background: error
                        ? 'var(--h-rose)'
                        : done
                            ? 'var(--h-mint)'
                            : pending
                                ? 'var(--h-yellow)'
                                : 'var(--h-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    flexShrink: 0,
                }}
            >
                {done && !error ? '✓' : error ? '✕' : pending ? '·' : ''}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: done || error ? 700 : 500 }}>{label}</div>
            <div className="h-mono h-muted" style={{ fontSize: 11 }}>{when || '—'}</div>
        </li>
    );
}

export default function RequestDetailSlideover({ request: req, show, onClose, variant = 'admin' }) {
    const [rejectNote, setRejectNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const isEmployee = variant === 'employee';

    useEffect(() => {
        if (!show) {
            setRejectNote('');
            setRevokeConfirmOpen(false);
            setDeleteConfirmOpen(false);
            setCancelConfirmOpen(false);
        }
    }, [show]);

    if (!req) return null;

    const canApprove = !isEmployee && req.status === 'PENDING';
    const canRevoke = !isEmployee && req.status === 'APPROVED';
    const canEmployeeCancel = isEmployee && req.status === 'PENDING';

    const handleApprove = () => {
        setProcessing(true);
        router.patch(route('admin.requests.approve', req.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: onClose,
        });
    };

    const handleReject = () => {
        setProcessing(true);
        router.patch(route('admin.requests.reject', req.id), {
            note_admin: rejectNote,
        }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: onClose,
        });
    };

    const handleRevoke = () => {
        setProcessing(true);
        router.patch(route('admin.requests.revoke', req.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => { setRevokeConfirmOpen(false); onClose(); },
        });
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route('admin.requests.destroy', req.id), {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => { setDeleteConfirmOpen(false); onClose(); },
        });
    };

    const handleEmployeeCancel = () => {
        setProcessing(true);
        router.patch(route('leave-request.cancel', req.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => { setCancelConfirmOpen(false); onClose(); },
        });
    };

    const title = `Richiesta${req.id ? ` #${req.id}` : ''}`;
    const createdLabel = fmtDateTime(req.createdAt);
    const isMalattia = String(req.leaveType ?? '').toUpperCase() === 'MALATTIA';

    const footer = (() => {
        if (canApprove) {
            return (
                <>
                    <Button
                        type="button"
                        onClick={handleReject}
                        disabled={processing}
                        style={{ background: 'var(--h-rose)' }}
                    >
                        <Icon name="x" size={14} />
                        Rifiuta
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleApprove}
                        disabled={processing}
                    >
                        <Icon name="check" size={14} />
                        Approva
                    </Button>
                </>
            );
        }
        if (canEmployeeCancel) {
            return (
                <>
                    <Button type="button" variant="ghost" onClick={onClose}>Chiudi</Button>
                    <Button
                        type="button"
                        onClick={() => setCancelConfirmOpen(true)}
                        disabled={processing}
                        style={{ background: 'var(--h-rose)' }}
                    >
                        Annulla richiesta
                    </Button>
                </>
            );
        }
        if (canRevoke) {
            return (
                <>
                    <Button type="button" variant="ghost" onClick={onClose}>Chiudi</Button>
                    <Button
                        type="button"
                        onClick={() => setRevokeConfirmOpen(true)}
                        disabled={processing}
                        style={{ background: 'var(--h-yellow)' }}
                    >
                        Revoca approvazione
                    </Button>
                </>
            );
        }
        return <Button type="button" variant="ghost" onClick={onClose}>Chiudi</Button>;
    })();

    return (
        <Slideover show={show} onClose={onClose} title={title} footer={footer}>
            <div style={{ display: 'grid', gap: 16 }}>
                {!isEmployee && req.userFullName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className="h-avatar lg">{initialsOf(req.userFullName)}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>{req.userFullName}</div>
                            <div className="h-muted" style={{ fontSize: 12 }}>
                                {req.userJobRole && (
                                    <span className="h-chip" style={{ marginRight: 6 }}>{req.userJobRole}</span>
                                )}
                                {req.userEmail}
                            </div>
                        </div>
                        <StatusBadge status={req.status} />
                    </div>
                )}

                {isEmployee && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <StatusBadge status={req.status} />
                    </div>
                )}

                <div
                    className="h-card h-card-flat"
                    style={{ padding: 14, background: 'var(--h-bg-2)' }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.6fr 1fr 1fr',
                            gap: 12,
                            alignItems: 'center',
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>PERIODO</div>
                            <div
                                className="h-display"
                                style={{
                                    fontSize: 15,
                                    marginTop: 4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    wordBreak: 'break-word',
                                }}
                                title={`${fmtDate(req.startDate)} — ${fmtDate(req.endDate)}`}
                            >
                                {fmtPeriodIT(req.startDate, req.endDate)}
                            </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>TIPO</div>
                            <div style={{ marginTop: 6 }}><LeaveTypeTag code={req.leaveType} /></div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>DURATA</div>
                            <div className="h-display" style={{ fontSize: 20, marginTop: 4, whiteSpace: 'nowrap' }}>
                                {req.requestedUnits}
                            </div>
                        </div>
                    </div>
                </div>

                {!isEmployee && req.roleConflictWarning && (
                    <div
                        className="h-card h-card-flat"
                        style={{ padding: 14, background: 'var(--h-rose)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                            <Icon name="warning" size={14} /> Conflitto di ruolo
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                            {req.roleConflictWarning}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gap: 0 }}>
                    {createdLabel && <DetailRow label="Inviata il" value={createdLabel} />}
                    <DetailRow
                        label="Stato"
                        value={<StatusBadge status={req.status} />}
                    />
                    {isMalattia && req.sickCertificatePuc && (
                        <DetailRow label="PUC" value={<span className="h-mono">{req.sickCertificatePuc}</span>} />
                    )}
                    {req.noteUser && (
                        <DetailRow
                            label="Nota dipendente"
                            value={<span style={{ fontStyle: 'italic' }}>“{req.noteUser}”</span>}
                        />
                    )}
                    {req.noteAdmin && (
                        <DetailRow
                            label="Nota admin"
                            value={<span style={{ fontStyle: 'italic' }}>“{req.noteAdmin}”</span>}
                        />
                    )}
                    {req.hasAttachment && (
                        <DetailRow
                            label="Allegato"
                            value={
                                <a
                                    href={route('leave-request.attachment', req.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
                                >
                                    <Icon name="download" size={12} /> Scarica{req.attachmentName ? `: ${req.attachmentName}` : ''}
                                </a>
                            }
                        />
                    )}
                </div>

                {canApprove && (
                    <div>
                        <label htmlFor="rejectNote" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                            Nota admin (in caso di rifiuto)
                        </label>
                        <textarea
                            id="rejectNote"
                            className="h-textarea"
                            rows={3}
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Es. periodo non disponibile"
                        />
                    </div>
                )}

                <div className="h-card h-card-flat" style={{ padding: 14 }}>
                    <div className="h-label" style={{ marginBottom: 10 }}>Cronologia</div>
                    <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                        <TimelineStep done label="Richiesta inviata" when={createdLabel || '—'} />
                        {req.status === 'APPROVED' && (
                            <TimelineStep done label="Approvata" when={fmtDate(req.approvedAt)} />
                        )}
                        {req.status === 'REJECTED' && (
                            <TimelineStep done error label="Rifiutata" when={fmtDate(req.approvedAt)} />
                        )}
                        {req.status === 'CANCELLED' && (
                            <TimelineStep done error label="Annullata" when="—" />
                        )}
                        {req.status === 'PENDING' && (
                            <TimelineStep pending label="In attesa di approvazione" when="—" />
                        )}
                    </ol>
                </div>

                {!isEmployee && (
                    <div
                        className="h-card h-card-flat"
                        style={{ padding: 14, background: 'var(--h-rose)' }}
                    >
                        <div className="h-heading" style={{ fontSize: 14 }}>Azioni distruttive</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                            L'eliminazione è definitiva. La revoca riporta la richiesta in "In attesa".
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDeleteConfirmOpen(true)}
                            disabled={processing}
                            style={{ marginTop: 12, background: 'var(--h-ink)', color: 'var(--h-bg)' }}
                        >
                            <Icon name="x" size={14} />
                            Elimina richiesta
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                show={cancelConfirmOpen}
                title="Annulla richiesta"
                message="Annullare questa richiesta? L'operazione non può essere disfatta."
                confirmLabel="Sì, annulla"
                cancelLabel="Indietro"
                destructive
                processing={processing}
                onConfirm={handleEmployeeCancel}
                onCancel={() => setCancelConfirmOpen(false)}
            />

            {!isEmployee && (
                <>
                    <ConfirmDialog
                        show={revokeConfirmOpen}
                        title="Revoca approvazione"
                        message="La richiesta tornerà in stato «In attesa» e il saldo verrà aggiornato automaticamente. Continuare?"
                        confirmLabel="Revoca"
                        cancelLabel="Annulla"
                        processing={processing}
                        onConfirm={handleRevoke}
                        onCancel={() => setRevokeConfirmOpen(false)}
                    />
                    <ConfirmDialog
                        show={deleteConfirmOpen}
                        title="Elimina richiesta"
                        message="La richiesta verrà eliminata definitivamente. Questa operazione non può essere annullata."
                        confirmLabel="Elimina"
                        cancelLabel="Annulla"
                        destructive
                        processing={processing}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteConfirmOpen(false)}
                    />
                </>
            )}
        </Slideover>
    );
}
