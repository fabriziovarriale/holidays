import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import Select from '@/Components/h/Select';
import StatusBadge from '@/Components/h/StatusBadge';
import RequestDetailSlideover from '@/Components/RequestDetailSlideover';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUSES = [
    { key: 'ALL', label: 'Tutte' },
    { key: 'PENDING', label: 'In attesa' },
    { key: 'APPROVED', label: 'Approvate' },
    { key: 'REJECTED', label: 'Rifiutate' },
    { key: 'CANCELLED', label: 'Annullate' },
];

function fmtITShort(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function initialsOf(fullName) {
    if (!fullName) return '—';
    const parts = fullName.trim().split(/\s+/);
    const a = (parts[0]?.[0] || '').toUpperCase();
    const b = (parts[1]?.[0] || '').toUpperCase();
    return (a + b) || '—';
}

export default function RequestsPage({ isAdmin, requests, leaveTypes, filters }) {
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState(filters?.q ?? '');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeStatus = filters?.status || 'ALL';
    const activeType = filters?.type || 'ALL';
    const hasActiveFilter =
        activeStatus !== 'ALL' || activeType !== 'ALL' || (filters?.q ?? '').length > 0;

    const counts = useMemo(() => {
        const c = { ALL: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
        for (const r of requests) {
            if (c[r.status] !== undefined) c[r.status]++;
        }
        return c;
    }, [requests]);

    const applyFilter = (patch) => {
        const next = {
            status: activeStatus,
            type: activeType,
            q: search,
            ...patch,
        };
        router.get(route('requests.index'), next, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilter({ q: search });
    };

    const filterKeyCopy = (code) => leaveTypes.find((lt) => lt.code === code)?.label ?? code;

    return (
        <AuthenticatedLayout
            header={
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div
                            className="h-mono"
                            style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}
                        >
                            {isAdmin ? 'ADMIN · RICHIESTE' : 'LE MIE RICHIESTE'}
                        </div>
                        <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
                            Richieste.
                        </h1>
                    </div>
                </div>
            }
        >
            <Head title="Richieste · Holidays" />

            <section className="h-card" style={{ padding: 0 }}>
                <div
                    style={{
                        padding: '14px 20px',
                        borderBottom: 'var(--h-bw) solid var(--h-line)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <h3 className="h-heading" style={{ fontSize: 18 }}>
                            {isAdmin ? 'Tutte le richieste' : 'Le tue richieste'}
                        </h3>
                        <p className="h-muted" style={{ fontSize: 12, marginTop: 2 }}>
                            {requests.length} {requests.length === 1 ? 'risultato' : 'risultati'}
                            {hasActiveFilter ? ' con filtri attivi' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className="h-btn h-btn-sm"
                        aria-expanded={filtersOpen}
                        style={{
                            background: filtersOpen ? 'var(--h-ink)' : 'var(--h-surface)',
                            color: filtersOpen ? 'var(--h-bg)' : 'var(--h-ink)',
                            boxShadow: filtersOpen ? 'var(--h-shadow-sm)' : 'none',
                        }}
                    >
                        <Icon name="filter" size={14} />
                        {filtersOpen ? 'Nascondi filtri' : 'Filtri'}
                        {hasActiveFilter && !filtersOpen && (
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: 'var(--h-coral)',
                                    border: '1px solid var(--h-line)',
                                }}
                            />
                        )}
                    </button>
                </div>

                {filtersOpen && (
                    <div
                        style={{
                            padding: '14px 20px',
                            borderBottom: 'var(--h-bw) solid var(--h-line)',
                            background: 'var(--h-bg-2)',
                            display: 'grid',
                            gap: 14,
                        }}
                    >
                        <div>
                            <div className="h-label" style={{ marginBottom: 6 }}>Stato</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {STATUSES.map((s) => {
                                    const active = activeStatus === s.key;
                                    return (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => applyFilter({ status: s.key })}
                                            className="h-btn h-btn-sm"
                                            style={{
                                                background: active ? 'var(--h-ink)' : 'var(--h-surface)',
                                                color: active ? 'var(--h-bg)' : 'var(--h-ink)',
                                                boxShadow: active ? 'var(--h-shadow-sm)' : 'none',
                                            }}
                                        >
                                            {s.label}
                                            <span
                                                className="h-mono"
                                                style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}
                                            >
                                                {counts[s.key] ?? 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="h-label" style={{ marginBottom: 6 }}>Tipo</div>
                            <Select
                                value={activeType}
                                onChange={(v) => applyFilter({ type: v })}
                                options={[
                                    { value: 'ALL', label: 'Tutti i tipi' },
                                    ...leaveTypes.map((lt) => ({ value: lt.code, label: lt.label })),
                                ]}
                                style={{ maxWidth: 240 }}
                            />
                        </div>

                        <div>
                            <div className="h-label" style={{ marginBottom: 6 }}>Ricerca</div>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    className="h-input"
                                    placeholder="Cerca persona, nota…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ flex: 1, minWidth: 200 }}
                                />
                                <Button type="submit" size="sm">
                                    <Icon name="search" size={12} /> Cerca
                                </Button>
                            </form>
                        </div>

                        {hasActiveFilter && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter({ status: 'ALL', type: 'ALL', q: '' });
                                    }}
                                    className="h-btn h-btn-sm h-btn-ghost"
                                    style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
                                >
                                    Azzera filtri
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {requests.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>
                        Nessuna richiesta con questi filtri.
                    </div>
                ) : (
                    <>
                        {/* Desktop: tabella densa */}
                        <div className="h-desktop-only" style={{ overflowX: 'auto' }}>
                            <table className="h-table">
                                <thead>
                                    <tr>
                                        {isAdmin && <th>Dipendente</th>}
                                        <th>Tipo</th>
                                        <th>Periodo</th>
                                        <th style={{ textAlign: 'right' }}>Durata</th>
                                        <th>Inviata</th>
                                        <th>Stato</th>
                                        <th>Nota</th>
                                        <th style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r) => (
                                        <tr
                                            key={r.id}
                                            onClick={() => setSelected(r)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {isAdmin && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                        <span className="h-avatar xs">{initialsOf(r.userFullName)}</span>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{r.userFullName}</div>
                                                            {r.userJobRole && (
                                                                <div className="h-muted" style={{ fontSize: 11 }}>
                                                                    {r.userJobRole}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <td><LeaveTypeTag code={r.leaveType} /></td>
                                            <td style={{ fontWeight: 600 }}>
                                                {fmtITShort(r.startDate)} — {fmtITShort(r.endDate)}
                                            </td>
                                            <td className="h-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                                                {r.requestedUnits}
                                            </td>
                                            <td className="h-muted h-mono" style={{ fontSize: 12 }}>
                                                {fmtITShort(r.createdAt)}
                                            </td>
                                            <td><StatusBadge status={r.status} /></td>
                                            <td
                                                style={{
                                                    fontSize: 12,
                                                    fontStyle: 'italic',
                                                    color: 'var(--h-muted)',
                                                    maxWidth: 220,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {r.noteAdmin || r.noteUser || '—'}
                                            </td>
                                            <td><Icon name="chevR" size={16} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile: lista card senza scroll orizzontale */}
                        <div className="h-mobile-only" style={{ flexDirection: 'column' }}>
                            {requests.map((r) => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelected(r)}
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'flex-start',
                                        padding: '14px 18px',
                                        borderBottom: '2px solid var(--h-ink)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {isAdmin && (
                                        <span className="h-avatar xs" style={{ flexShrink: 0, marginTop: 2 }}>
                                            {initialsOf(r.userFullName)}
                                        </span>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {isAdmin && (
                                            <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>
                                                {r.userFullName}
                                                {r.userJobRole && (
                                                    <span className="h-muted" style={{ fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
                                                        · {r.userJobRole}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: isAdmin ? 6 : 0 }}>
                                            <LeaveTypeTag code={r.leaveType} />
                                            <StatusBadge status={r.status} />
                                            <span className="h-mono" style={{ fontSize: 11, fontWeight: 700 }}>
                                                {r.requestedUnits}
                                            </span>
                                        </div>
                                        <div className="h-mono" style={{ fontSize: 12, color: 'var(--h-muted)', marginTop: 6 }}>
                                            {fmtITShort(r.startDate)} → {fmtITShort(r.endDate)}
                                            <span style={{ margin: '0 6px' }}>·</span>
                                            inviata {fmtITShort(r.createdAt)}
                                        </div>
                                        {(r.noteAdmin || r.noteUser) && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontStyle: 'italic',
                                                    color: 'var(--h-muted)',
                                                    marginTop: 6,
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                "{r.noteAdmin || r.noteUser}"
                                            </div>
                                        )}
                                    </div>
                                    <Icon name="chevR" size={16} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <RequestDetailSlideover
                request={selected}
                show={Boolean(selected)}
                onClose={() => setSelected(null)}
                variant={isAdmin ? 'admin' : 'employee'}
            />
        </AuthenticatedLayout>
    );
}
