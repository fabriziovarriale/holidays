import ConfirmDialog from '@/Components/ConfirmDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Slideover from '@/Components/Slideover';
import SlideoverAlert from '@/Components/SlideoverAlert';
import Textarea from '@/Components/Textarea';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const STATUS_LABELS = {
    PENDING: 'In attesa',
    APPROVED: 'Approvata',
    REJECTED: 'Rifiutata',
    CANCELLED: 'Annullata',
};

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
            onSuccess: () => {
                setCancelConfirmOpen(false);
                onClose();
            },
        });
    };

    const createdLabel = req.createdAt
        ? new Date(req.createdAt).toLocaleString('it-IT', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
        : null;

    return (
        <Slideover show={show} onClose={onClose} title="Dettaglio richiesta">
            <div className="space-y-4">
                {!isEmployee && req.roleConflictWarning && (
                    <SlideoverAlert
                        variant="warning"
                        title="Conflitto di ruolo"
                        body={req.roleConflictWarning}
                    />
                )}
                <dl className="space-y-3">
                    {!isEmployee && (
                        <div>
                            <dt className="text-sm text-muted-foreground">Dipendente</dt>
                            <dd className="font-medium text-foreground">{req.userFullName}</dd>
                        </div>
                    )}
                    {createdLabel && (
                        <div>
                            <dt className="text-sm text-muted-foreground">Inviata il</dt>
                            <dd className="text-foreground">{createdLabel}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm text-muted-foreground">Tipo</dt>
                        <dd className="text-foreground">{req.leaveType}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-muted-foreground">Periodo</dt>
                        <dd className="text-foreground">{req.startDate} — {req.endDate}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-muted-foreground">Giorni/Ore richieste</dt>
                        <dd className="text-foreground">{req.requestedUnits}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-muted-foreground">Stato</dt>
                        <dd>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                req.status === 'REJECTED' ? 'bg-destructive/20 text-destructive' :
                                'bg-muted text-muted-foreground'
                            }`}>
                                {STATUS_LABELS[req.status] || req.status}
                            </span>
                        </dd>
                    </div>
                    {req.noteUser && (
                        <div>
                            <dt className="text-sm text-muted-foreground">Note dipendente</dt>
                            <dd className="text-foreground">{req.noteUser}</dd>
                        </div>
                    )}
                    {req.noteAdmin && (
                        <div>
                            <dt className="text-sm text-muted-foreground">Note admin</dt>
                            <dd className="text-foreground">{req.noteAdmin}</dd>
                        </div>
                    )}
                    {String(req.leaveType ?? '').toUpperCase() === 'MALATTIA' && req.sickCertificatePuc && (
                        <div>
                            <dt className="text-sm text-muted-foreground">PUC certificato</dt>
                            <dd className="text-foreground">{req.sickCertificatePuc}</dd>
                        </div>
                    )}
                    {req.hasAttachment && (
                        <div>
                            <dt className="text-sm text-muted-foreground">Allegato</dt>
                            <dd>
                                <a
                                    href={route('leave-request.attachment', req.id)}
                                    className="text-sm font-medium text-primary hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Scarica{req.attachmentName ? `: ${req.attachmentName}` : ''}
                                </a>
                            </dd>
                        </div>
                    )}
                </dl>

                {canEmployeeCancel && (
                    <div className="border-t border-border pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setCancelConfirmOpen(true)}
                            disabled={processing}
                            className="!border-destructive !text-destructive hover:!bg-destructive/10"
                        >
                            Annulla richiesta
                        </SecondaryButton>
                    </div>
                )}

                {!isEmployee && (
                    <>
                        {canApprove && (
                            <>
                                <div>
                                    <label htmlFor="rejectNote" className="block text-sm font-medium text-muted-foreground mb-1">
                                        Motivo rifiuto (opzionale)
                                    </label>
                                    <Textarea
                                        id="rejectNote"
                                        value={rejectNote}
                                        onChange={(e) => setRejectNote(e.target.value)}
                                        placeholder="Es. periodo non disponibile"
                                        rows={2}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <PrimaryButton
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="!bg-emerald-600 hover:!bg-emerald-500"
                                    >
                                        Approva
                                    </PrimaryButton>
                                    <SecondaryButton
                                        onClick={handleReject}
                                        disabled={processing}
                                        className="!border-destructive !text-destructive hover:!bg-destructive/10"
                                    >
                                        Rifiuta
                                    </SecondaryButton>
                                </div>
                            </>
                        )}

                        {canRevoke && (
                            <div className="border-t border-border pt-4">
                                <p className="mb-3 text-xs text-muted-foreground">
                                    La revoca riporta la richiesta in stato "In attesa" per una nuova valutazione.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setRevokeConfirmOpen(true)}
                                    disabled={processing}
                                    className="inline-flex items-center rounded-md border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                                >
                                    Revoca approvazione
                                </button>
                            </div>
                        )}

                        <div className="border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={processing}
                                className="inline-flex items-center rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                                Elimina richiesta
                            </button>
                        </div>
                    </>
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
