import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Slideover from '@/Components/Slideover';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

function initialsOf(firstName, lastName) {
    const a = (firstName?.[0] || '').toUpperCase();
    const b = (lastName?.[0] || '').toUpperCase();
    return (a + b) || '—';
}

export default function UserDetailSlideover({ user, year, onClose }) {
    const { data, setData, patch, processing, errors } = useForm({
        allocated_days: user?.allocatedDays ?? 0,
        year: year ?? new Date().getFullYear(),
    });
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setData({
                allocated_days: user.allocatedDays ?? 0,
                year: year ?? new Date().getFullYear(),
            });
        }
    }, [user?.id, year]);

    const fullName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
        : '';
    const used = user?.usedDays ?? 0;
    const allocated = parseInt(String(data.allocated_days), 10);
    const remaining =
        user && !isNaN(allocated) ? Math.max(0, allocated - used) : user?.remaining ?? 0;

    const submit = (e) => {
        e.preventDefault();
        if (!user) return;
        patch(route('admin.users.balance', user.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const handleDelete = () => {
        if (!user) return;
        setDeleting(true);
        router.delete(route('admin.users.destroy', user.id), {
            onSuccess: () => { setDeleting(false); setConfirmOpen(false); onClose(); },
            onError: () => setDeleting(false),
        });
    };

    return (
        <Slideover
            show={Boolean(user)}
            onClose={onClose}
            title={fullName || 'Dettaglio utente'}
            footer={
                user && (
                    <>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>
                            Chiudi
                        </Button>
                        <Button type="submit" form="userBudgetForm" variant="primary" disabled={processing}>
                            <Icon name="check" size={14} />
                            {processing ? 'Salvataggio…' : 'Salva budget'}
                        </Button>
                    </>
                )
            }
        >
            {user && (
                <div style={{ display: 'grid', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span className="h-avatar lg">{initialsOf(user.firstName, user.lastName)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="h-display" style={{ fontSize: 22 }}>{fullName}</div>
                            <div className="h-muted" style={{ fontSize: 12 }}>
                                {user.jobRole ? <span className="h-chip" style={{ marginRight: 6 }}>{user.jobRole}</span> : null}
                                {user.email}
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => router.post(route('admin.users.impersonate', user.id))}
                        >
                            <Icon name="user" size={14} />
                            Entra come
                        </Button>
                    </div>

                    <div
                        className="h-card h-card-flat"
                        style={{
                            padding: 18,
                            background: 'var(--h-bg-2)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 16,
                        }}
                    >
                        <div>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>BUDGET {data.year}</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{allocated || 0}</div>
                        </div>
                        <div>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>USATI</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{used}</div>
                        </div>
                        <div>
                            <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>RESIDUI</div>
                            <div className="h-display" style={{ fontSize: 28, color: 'var(--h-coral)' }}>{remaining}</div>
                        </div>
                    </div>

                    <form id="userBudgetForm" onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <label htmlFor="allocated_days" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                                Giorni ferie assegnati ({data.year})
                            </label>
                            <input
                                id="allocated_days"
                                className="h-input h-mono"
                                type="number"
                                min={0}
                                max={365}
                                value={data.allocated_days}
                                onChange={(e) => setData('allocated_days', e.target.value)}
                                required
                            />
                            <FieldError message={errors.allocated_days} />
                            <div className="h-muted" style={{ fontSize: 11, marginTop: 6 }}>
                                I giorni usati sono la somma delle richieste <b>approvate</b> con tipologia che
                                scala il budget (es. ferie) per l'anno {data.year}.
                            </div>
                        </div>
                    </form>

                    <div
                        className="h-card h-card-flat"
                        style={{ padding: 18, background: 'var(--h-rose)' }}
                    >
                        <div className="h-heading" style={{ fontSize: 15 }}>Zona pericolo</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                            L'eliminazione è permanente e rimuove anche tutte le richieste associate.
                        </div>
                        <Button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            style={{
                                marginTop: 12,
                                background: 'var(--h-ink)',
                                color: 'var(--h-bg)',
                            }}
                        >
                            <Icon name="x" size={14} />
                            Elimina utente
                        </Button>
                    </div>

                    <ConfirmDialog
                        show={confirmOpen}
                        title="Elimina utente"
                        message={`Eliminare definitivamente "${fullName}"? Tutte le sue richieste saranno rimosse.`}
                        confirmLabel="Elimina"
                        cancelLabel="Annulla"
                        destructive
                        processing={deleting}
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmOpen(false)}
                    />
                </div>
            )}
        </Slideover>
    );
}
