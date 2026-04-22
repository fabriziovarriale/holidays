import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import StatCard from '@/Components/h/StatCard';
import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';

function LegendDot({ label, color }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
                style={{
                    width: 12,
                    height: 12,
                    background: color,
                    border: '2px solid var(--h-line)',
                    display: 'inline-block',
                }}
            />
            {label}
        </span>
    );
}

export default function ReportsPage({ year, stats, monthly, roleBreakdown }) {
    const maxMonthly = useMemo(
        () => Math.max(1, ...monthly.map((m) => m.ferie + m.malattia)),
        [monthly]
    );

    const topRoleDays = useMemo(
        () => Math.max(1, ...roleBreakdown.map((r) => r.days)),
        [roleBreakdown]
    );

    const changeYear = (newYear) =>
        router.get(
            route('admin.reports.index'),
            { year: newYear },
            { preserveScroll: true, preserveState: true, replace: true }
        );

    const approvalRateLabel =
        stats.approvalRate == null ? '—' : `${stats.approvalRate}%`;

    return (
        <AuthenticatedLayout
            header={
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div className="h-mono" style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}>
                            ADMIN · REPORT {year}
                        </div>
                        <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
                            Report.
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="h-label">Anno</span>
                            <select
                                value={String(year)}
                                onChange={(e) => changeYear(e.target.value)}
                                className="h-select"
                                style={{ width: 110 }}
                            >
                                {[year - 1, year, year + 1].map((y) => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </label>
                        <Button
                            as="a"
                            href={route('admin.reports.export-leaves', { year })}
                        >
                            <Icon name="download" size={14} /> CSV {year}
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Report ${year} · Holidays`} />

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                    <StatCard
                        label={`Ferie ${year}`}
                        value={`${stats.ferieDays}g`}
                        hint="approvate"
                        tone="coral"
                    />
                    <StatCard
                        label={`Permessi ${year}`}
                        value={`${stats.permessoHours}h`}
                        hint="erogate"
                        tone="yellow"
                    />
                    <StatCard
                        label={`Malattia ${year}`}
                        value={`${stats.malattiaDays}g`}
                        hint="registrati"
                        tone="rose"
                    />
                    <StatCard
                        label="Tasso approvazione"
                        value={approvalRateLabel}
                        hint={`${stats.approvedCount}/${stats.approvedCount + stats.rejectedCount} decise`}
                        tone="mint"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
                    <section className="h-card" style={{ padding: 22 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="h-heading" style={{ fontSize: 18 }}>Distribuzione assenze {year}</h3>
                            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                                <LegendDot label="Ferie" color="var(--h-coral)" />
                                <LegendDot label="Malattia" color="var(--h-rose)" />
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(12, 1fr)',
                                gap: 6,
                                height: 220,
                                alignItems: 'end',
                            }}
                        >
                            {monthly.map((m) => {
                                const ferieH = (m.ferie / maxMonthly) * 160;
                                const malattiaH = (m.malattia / maxMonthly) * 160;
                                return (
                                    <div key={m.index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column-reverse',
                                                height: 170,
                                            }}
                                        >
                                            {m.ferie > 0 && (
                                                <div
                                                    title={`Ferie: ${m.ferie}g`}
                                                    style={{
                                                        height: `${ferieH}px`,
                                                        background: 'var(--h-coral)',
                                                        border: '2px solid var(--h-line)',
                                                    }}
                                                />
                                            )}
                                            {m.malattia > 0 && (
                                                <div
                                                    title={`Malattia: ${m.malattia}g`}
                                                    style={{
                                                        height: `${malattiaH}px`,
                                                        background: 'var(--h-rose)',
                                                        borderLeft: '2px solid var(--h-line)',
                                                        borderRight: '2px solid var(--h-line)',
                                                        borderTop: m.malattia > 0 ? '2px solid var(--h-line)' : 'none',
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div
                                            className="h-mono"
                                            style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--h-muted)' }}
                                        >
                                            {m.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="h-card" style={{ padding: 22 }}>
                        <h3 className="h-heading" style={{ fontSize: 16, marginBottom: 14 }}>
                            Ferie per ruolo
                        </h3>
                        {roleBreakdown.length === 0 ? (
                            <div className="h-muted" style={{ fontSize: 13 }}>
                                Nessuna ferie approvata in questo anno.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {roleBreakdown.map((r) => {
                                    const pct = Math.min(1, r.days / topRoleDays);
                                    return (
                                        <div key={r.role}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                <b>{r.role}</b>
                                                <span className="h-mono">{r.days}g</span>
                                            </div>
                                            <div className="h-bar" style={{ height: 14 }}>
                                                <div
                                                    style={{
                                                        width: `${pct * 100}%`,
                                                        height: '100%',
                                                        background: 'var(--h-coral)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
                            <Button
                                as="a"
                                href={route('admin.reports.export-leaves', { year })}
                            >
                                <Icon name="download" size={14} /> Esporta CSV {year}
                            </Button>
                        </div>
                    </section>
                </div>

                <section className="h-card" style={{ padding: 22 }}>
                    <h3 className="h-heading" style={{ fontSize: 16, marginBottom: 12 }}>
                        Riepilogo numerico {year}
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 12,
                            fontSize: 13,
                        }}
                    >
                        <div>
                            <div className="h-label">Dipendenti attivi</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{stats.activeEmployees}</div>
                        </div>
                        <div>
                            <div className="h-label">Approvate</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{stats.approvedCount}</div>
                        </div>
                        <div>
                            <div className="h-label">In attesa</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{stats.pendingCount}</div>
                        </div>
                        <div>
                            <div className="h-label">Rifiutate</div>
                            <div className="h-display" style={{ fontSize: 28 }}>{stats.rejectedCount}</div>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
