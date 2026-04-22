import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Icon from '@/Components/h/Icon';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';

function fmtITShort(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function fmtITLong(value) {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function initialsOf(firstName, lastName) {
    const a = (firstName?.[0] || '').toUpperCase();
    const b = (lastName?.[0] || '').toUpperCase();
    return (a + b) || '—';
}

function daysUntil(value) {
    if (!value) return null;
    const d = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

export default function TeamPage({ team, todayOff, upcoming, windowFrom, windowTo, roles, filters }) {
    const activeRole = filters?.role || 'ALL';

    const changeRole = (role) => {
        router.get(
            route('team.index'),
            role === 'ALL' ? {} : { role },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const upcomingByUser = useMemo(() => {
        const map = new Map();
        for (const req of upcoming) {
            if (!map.has(req.userId)) map.set(req.userId, []);
            map.get(req.userId).push(req);
        }
        return map;
    }, [upcoming]);

    return (
        <AuthenticatedLayout
            header={
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div className="h-mono" style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}>
                            TEAM · {fmtITShort(windowFrom)} → {fmtITShort(windowTo)}
                        </div>
                        <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
                            Team.
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="h-label">Ruolo</span>
                            <select
                                className="h-select"
                                value={activeRole}
                                onChange={(e) => changeRole(e.target.value)}
                                style={{ width: 160 }}
                            >
                                <option value="ALL">Tutti</option>
                                {roles.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            }
        >
            <Head title="Team · Holidays" />

            <div style={{ display: 'grid', gap: 18 }}>
                <section className="h-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <h3 className="h-heading" style={{ fontSize: 18 }}>
                            Oggi fuori ufficio
                        </h3>
                        <div className="h-mono h-muted" style={{ fontSize: 11 }}>
                            {todayOff.length} persone
                        </div>
                    </div>

                    {todayOff.length === 0 ? (
                        <div className="h-muted" style={{ fontSize: 13 }}>
                            Nessuno assente oggi — tutto il team è operativo.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                            {todayOff.map((r) => {
                                const parts = (r.userFullName || '').split(' ');
                                return (
                                    <div
                                        key={r.id}
                                        style={{
                                            border: 'var(--h-bw) solid var(--h-line)',
                                            borderRadius: 'var(--h-radius)',
                                            padding: 12,
                                            display: 'flex',
                                            gap: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span className="h-avatar">{initialsOf(parts[0], parts[1])}</span>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.userFullName}
                                            </div>
                                            <div className="h-muted" style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <LeaveTypeTag code={r.leaveType} />
                                                <span>· rientra {fmtITShort(r.returnsOn)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="h-card" style={{ padding: 0 }}>
                    <div style={{ padding: '18px 22px', borderBottom: 'var(--h-bw) solid var(--h-line)' }}>
                        <h3 className="h-heading" style={{ fontSize: 18 }}>Prossime assenze approvate</h3>
                        <p className="h-muted" style={{ fontSize: 13, marginTop: 4 }}>
                            Finestra {fmtITLong(windowFrom)} → {fmtITLong(windowTo)}.
                        </p>
                    </div>

                    {upcoming.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>
                            Nessuna assenza approvata nei prossimi 60 giorni.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="h-table">
                                <thead>
                                    <tr>
                                        <th>Dipendente</th>
                                        <th>Tipo</th>
                                        <th>Periodo</th>
                                        <th style={{ textAlign: 'right' }}>Durata</th>
                                        <th style={{ textAlign: 'right' }}>Tra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcoming.map((r) => {
                                        const parts = (r.userFullName || '').split(' ');
                                        const diff = daysUntil(r.startDate);
                                        return (
                                            <tr key={r.id}>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                        <span className="h-avatar xs">{initialsOf(parts[0], parts[1])}</span>
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
                                                <td><LeaveTypeTag code={r.leaveType} /></td>
                                                <td style={{ fontWeight: 600 }}>
                                                    {fmtITShort(r.startDate)} — {fmtITShort(r.endDate)}
                                                </td>
                                                <td className="h-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                                                    {r.requestedUnits}
                                                </td>
                                                <td className="h-mono" style={{ textAlign: 'right' }}>
                                                    {diff == null ? '—' : diff === 0 ? 'oggi' : `${diff}g`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="h-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <h3 className="h-heading" style={{ fontSize: 18 }}>
                            Squadra
                        </h3>
                        <div className="h-mono h-muted" style={{ fontSize: 11 }}>
                            {team.length} {team.length === 1 ? 'persona' : 'persone'}
                        </div>
                    </div>

                    {team.length === 0 ? (
                        <div className="h-muted" style={{ fontSize: 13 }}>
                            Nessun dipendente attivo {activeRole !== 'ALL' ? `con ruolo ${activeRole}` : ''}.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                            {team.map((member) => {
                                const plans = upcomingByUser.get(member.id) || [];
                                return (
                                    <div
                                        key={member.id}
                                        style={{
                                            border: 'var(--h-bw) solid var(--h-line)',
                                            borderRadius: 'var(--h-radius)',
                                            padding: 12,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            background: member.onLeaveToday ? 'var(--h-bg-2)' : 'var(--h-surface)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <span className="h-avatar">{initialsOf(member.firstName, member.lastName)}</span>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{member.fullName}</div>
                                                {member.jobRole && (
                                                    <div className="h-muted" style={{ fontSize: 11 }}>{member.jobRole}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>
                                            {member.onLeaveToday ? (
                                                <span style={{ color: 'var(--h-coral)', fontWeight: 700 }}>
                                                    <Icon name="clock" size={10} /> FUORI OGGI
                                                </span>
                                            ) : plans.length > 0 ? (
                                                <span className="h-muted">
                                                    Prossima: {fmtITShort(plans[0].startDate)} ({plans[0].leaveType})
                                                </span>
                                            ) : (
                                                <span className="h-muted">Nessuna assenza pianificata</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
