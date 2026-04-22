import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
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

    const activeStatus = filters?.status || 'ALL';
    const activeType = filters?.type || 'ALL';

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
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {isAdmin && (
                            <Button
                                as="a"
                                href={route('admin.reports.export-leaves', { year: new Date().getFullYear() })}
                                size="sm"
                            >
                                <Icon name="download" size={12} /> CSV
                            </Button>
                        )}
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
                        flexWrap: 'wrap',
                        gap: 10,
                    }}
                >
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

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="h-select"
                            value={activeType}
                            onChange={(e) => applyFilter({ type: e.target.value })}
                            style={{ width: 160 }}
                        >
                            <option value="ALL">Tutti i tipi</option>
                            {leaveTypes.map((lt) => (
                                <option key={lt.code} value={lt.code}>{lt.label}</option>
                            ))}
                        </select>

                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
                            <input
                                type="text"
                                className="h-input"
                                placeholder="Cerca persona, nota…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: 220 }}
                            />
                            <Button type="submit" size="sm">
                                <Icon name="search" size={12} />
                            </Button>
                        </form>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>
                        Nessuna richiesta con questi filtri.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
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
