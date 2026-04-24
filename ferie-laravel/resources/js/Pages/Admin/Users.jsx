import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import Select from '@/Components/h/Select';
import CreateUserSlideover from '@/Components/CreateUserSlideover';
import UserDetailSlideover from '@/Components/UserDetailSlideover';
import { Head, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const CREATE_USER_ERROR_KEYS = ['firstName', 'lastName', 'email', 'password', 'password_confirmation', 'jobRole'];

export default function Users({ users, year }) {
    const { flash = {}, errors = {} } = usePage().props;
    const hasCreateErrors = CREATE_USER_ERROR_KEYS.some((k) => errors?.[k]);
    const [createSlideoverOpen, setCreateSlideoverOpen] = useState(hasCreateErrors);
    const [selectedUser, setSelectedUser] = useState(null);
    const status = flash?.status;

    useEffect(() => {
        if (hasCreateErrors) setCreateSlideoverOpen(true);
    }, [hasCreateErrors]);

    useEffect(() => {
        if (status === 'Utente creato.') setCreateSlideoverOpen(false);
    }, [status]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openUserId = params.get('openUser');
        if (openUserId) {
            const user = users.find((u) => String(u.id) === openUserId);
            if (user) setSelectedUser(user);
        }
    }, [users]);

    const changeYear = (newYear) =>
        router.get(
            route('admin.users.index'),
            { year: newYear },
            { preserveScroll: true, preserveState: true }
        );

    return (
        <AuthenticatedLayout
            header={
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div
                            className="h-mono"
                            style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}
                        >
                            DIPENDENTI · ANNO {year}
                        </div>
                        <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
                            Utenti.
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="h-label">Anno</span>
                            <Select
                                value={String(year)}
                                onChange={(v) => changeYear(v)}
                                options={[year - 1, year, year + 1].map((y) => ({
                                    value: String(y),
                                    label: String(y),
                                }))}
                                style={{ width: 120 }}
                            />
                        </label>
                        <Button variant="primary" onClick={() => setCreateSlideoverOpen(true)}>
                            <Icon name="plus" size={16} /> Nuovo utente
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Utenti · Holidays" />

            {status && (
                <div className="h-card" style={{ padding: 14, marginBottom: 18, background: 'var(--h-mint)' }}>
                    <strong>✓</strong> {status}
                </div>
            )}

            <section className="h-card" style={{ padding: 0 }}>
                <div style={{ padding: '18px 22px', borderBottom: 'var(--h-bw) solid var(--h-line)' }}>
                    <h3 className="h-heading" style={{ fontSize: 20 }}>Dipendenti</h3>
                    <p className="h-muted" style={{ fontSize: 13, marginTop: 4 }}>
                        Clicca una riga per dettagli e budget ferie {year}.
                    </p>
                </div>

                {users.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>
                        Nessun dipendente
                    </div>
                ) : (
                    <>
                        {/* Desktop: tabella completa */}
                        <div className="h-desktop-only" style={{ overflowX: 'auto' }}>
                            <table className="h-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Ruolo</th>
                                        <th style={{ textAlign: 'right' }}>Budget</th>
                                        <th style={{ textAlign: 'right' }}>Usati</th>
                                        <th style={{ textAlign: 'right' }}>Residui</th>
                                        <th style={{ textAlign: 'right' }}>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr
                                            key={u.id}
                                            onClick={() => setSelectedUser(u)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                                    <span className="h-avatar xs">{initialsOf(u.firstName, u.lastName)}</span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--h-muted)' }}>{u.email}</td>
                                            <td>{u.jobRole ? <span className="h-chip">{u.jobRole}</span> : <span className="h-muted">—</span>}</td>
                                            <td className="h-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{u.allocatedDays}</td>
                                            <td className="h-mono" style={{ textAlign: 'right' }}>{u.usedDays}</td>
                                            <td className="h-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{u.remaining}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.post(route('admin.users.impersonate', u.id));
                                                    }}
                                                    className="h-btn h-btn-sm h-btn-ghost"
                                                >
                                                    Entra come
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile: lista card */}
                        <div className="h-mobile-only" style={{ flexDirection: 'column' }}>
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'flex-start',
                                        padding: '14px 18px',
                                        borderBottom: '2px solid var(--h-ink)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span className="h-avatar xs" style={{ flexShrink: 0, marginTop: 2 }}>
                                        {initialsOf(u.firstName, u.lastName)}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>
                                            {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                                        </div>
                                        <div className="h-muted" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                            {u.email}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                            {u.jobRole && <span className="h-chip">{u.jobRole}</span>}
                                            <span
                                                className="h-mono"
                                                style={{
                                                    fontSize: 11,
                                                    border: '2px solid var(--h-line)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                }}
                                            >
                                                {u.usedDays} / {u.allocatedDays} usati
                                            </span>
                                            <span
                                                className="h-mono"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: 'var(--h-coral)',
                                                    border: '2px solid var(--h-line)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    background: 'var(--h-surface)',
                                                }}
                                            >
                                                {u.remaining} residui
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.post(route('admin.users.impersonate', u.id));
                                            }}
                                            className="h-btn h-btn-sm h-btn-ghost"
                                            style={{ marginTop: 8, padding: '4px 10px' }}
                                        >
                                            Entra come
                                        </button>
                                    </div>
                                    <Icon name="chevR" size={16} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <CreateUserSlideover
                show={createSlideoverOpen}
                onClose={() => setCreateSlideoverOpen(false)}
            />

            <UserDetailSlideover
                user={selectedUser}
                year={year}
                onClose={() => setSelectedUser(null)}
            />
        </AuthenticatedLayout>
    );
}

function initialsOf(firstName, lastName) {
    const a = (firstName?.[0] || '').toUpperCase();
    const b = (lastName?.[0] || '').toUpperCase();
    return (a + b) || '—';
}
