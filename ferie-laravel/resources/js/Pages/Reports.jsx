import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import Select from '@/Components/h/Select';
import StatCard from '@/Components/h/StatCard';
import ExportCsvSlideover from '@/Components/ExportCsvSlideover';
import { fmtDate } from '@/lib/date';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

const ACTIVITY_COLOR = {
    approved: 'var(--h-mint)',
    rejected: 'var(--h-rose)',
    cancelled: 'var(--h-bg-2)',
    pending: 'var(--h-yellow)',
};

function AbsenceRow({ label, data }) {
    const rate = Math.max(0, Math.min(100, data?.rate ?? 0));
    const high = rate >= 30;
    const medium = rate >= 15 && rate < 30;
    const color = high ? 'var(--h-rose)' : medium ? 'var(--h-yellow)' : 'var(--h-mint)';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, marginBottom: 4 }}>
                <b>{label}</b>
                <span className="h-mono" style={{ fontSize: 14 }}>{rate.toFixed(1)}%</span>
            </div>
            <div className="h-bar" style={{ height: 12 }}>
                <div
                    style={{
                        width: `${rate}%`,
                        height: '100%',
                        background: color,
                    }}
                />
            </div>
            {data?.totalDays > 0 && (
                <div className="h-muted h-mono" style={{ fontSize: 10, marginTop: 3, letterSpacing: '0.04em' }}>
                    {data.absentDays}/{data.totalDays} giorni-persona
                </div>
            )}
        </div>
    );
}

export default function ReportsPage({
    year,
    stats,
    monthly,
    absenceRate = { daily: { rate: 0 }, weekly: { rate: 0 }, monthly: { rate: 0 } },
    remainingByEmployee = [],
    leaveTypesForExport = [],
    activity = [],
}) {
    const [exportOpen, setExportOpen] = useState(false);
    const maxMonthly = useMemo(
        () => Math.max(1, ...monthly.map((m) => m.ferie + m.malattia)),
        [monthly]
    );

    const maxRemaining = useMemo(
        () => Math.max(1, ...remainingByEmployee.map((e) => e.allocated || 0)),
        [remainingByEmployee]
    );

    const changeYear = (newYear) =>
        router.get(
            route('admin.reports.index'),
            { year: newYear },
            { preserveScroll: true, preserveState: true, replace: true }
        );

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
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setExportOpen(true)}
                        >
                            <Icon name="download" size={14} /> Esporta CSV
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Report ${year} · Holidays`} />

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <StatCard
                        label={`Approvate ${year}`}
                        value={stats.approvedCount}
                        hint="richieste"
                        tone="mint"
                    />
                    <StatCard
                        label={`Rifiutate ${year}`}
                        value={stats.rejectedCount}
                        hint="richieste"
                        tone="rose"
                    />
                    <StatCard
                        label="In attesa"
                        value={stats.pendingCount}
                        hint="da decidere"
                        tone="yellow"
                    />
                    <StatCard
                        label="Oggi in ufficio"
                        value={`${stats.inOfficeToday ?? stats.activeEmployees}/${stats.activeEmployees}`}
                        hint={stats.outToday > 0 ? `${stats.outToday} fuori` : 'tutti presenti'}
                        tone="coral"
                    />
                </div>

                <section className="h-card" style={{ padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: 'var(--h-bw) solid var(--h-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 className="h-heading" style={{ fontSize: 18 }}>Attività recente</h3>
                            <p className="h-muted" style={{ fontSize: 12, marginTop: 2 }}>
                                Ultime richieste create o aggiornate.
                            </p>
                        </div>
                        <div className="h-mono h-muted" style={{ fontSize: 11 }}>
                            {activity.length} {activity.length === 1 ? 'evento' : 'eventi'}
                        </div>
                    </div>

                    {activity.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--h-muted)', fontSize: 13 }}>
                            Nessuna attività recente.
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {activity.map((a, i) => (
                                <li
                                    key={a.id}
                                    style={{
                                        padding: '12px 20px',
                                        borderBottom: i < activity.length - 1 ? '2px solid var(--h-line)' : 'none',
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 8,
                                            height: 40,
                                            background: ACTIVITY_COLOR[a.kind] || 'var(--h-bg-2)',
                                            border: '2px solid var(--h-line)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13 }}>{a.text}</div>
                                        <div className="h-muted h-mono" style={{ fontSize: 10, marginTop: 2, letterSpacing: '0.04em' }}>
                                            {fmtDate(a.at)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="h-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                            <div className="h-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--h-muted)' }}>
                                OPERATIVITÀ
                            </div>
                            <h3 className="h-heading" style={{ fontSize: 16 }}>
                                Tasso di assenza
                            </h3>
                            <div className="h-muted" style={{ fontSize: 11 }}>
                                % capacità persa per ferie + malattia approvate
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 14 }}>
                            <AbsenceRow label="Oggi"        data={absenceRate.daily} />
                            <AbsenceRow label="Questa settimana" data={absenceRate.weekly} />
                            <AbsenceRow label="Questo mese" data={absenceRate.monthly} />
                        </div>
                    </section>
                </div>

                <section className="h-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div className="h-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--h-muted)' }}>
                                COMPLIANCE / HR
                            </div>
                            <h3 className="h-heading" style={{ fontSize: 16 }}>
                                Ferie residue {year}
                            </h3>
                            <div className="h-muted" style={{ fontSize: 11 }}>
                                Giorni di ferie ancora a disposizione, per dipendente — ordinati dal più basso al più alto.
                            </div>
                        </div>
                    </div>

                    {remainingByEmployee.length === 0 ? (
                        <div className="h-muted" style={{ fontSize: 13 }}>
                            Nessun dipendente attivo.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                            {remainingByEmployee.map((e) => {
                                const allocated = e.allocated || 0;
                                const usedPct = allocated > 0 ? Math.min(1, e.used / allocated) : 0;
                                const remainingFraction = allocated > 0 ? e.remaining / allocated : 0;
                                const lowStock = remainingFraction < 0.2 && allocated > 0;
                                return (
                                    <div key={e.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, fontSize: 13, marginBottom: 4 }}>
                                            <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                                                <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</b>
                                                <span className="h-muted" style={{ fontSize: 11 }}>{e.role}</span>
                                            </div>
                                            <div className="h-mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                                <b style={{ color: lowStock ? 'var(--h-coral)' : 'inherit' }}>{e.remaining}g</b>
                                                <span className="h-muted"> / {allocated}g</span>
                                            </div>
                                        </div>
                                        <div className="h-bar" style={{ height: 10, position: 'relative' }}>
                                            <div
                                                style={{
                                                    width: `${(allocated > 0 ? (allocated / maxRemaining) : 0) * 100}%`,
                                                    height: '100%',
                                                    background: 'var(--h-bg-2)',
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: `${(allocated > 0 ? ((e.used / maxRemaining)) : 0) * 100}%`,
                                                    height: '100%',
                                                    background: lowStock ? 'var(--h-rose)' : 'var(--h-coral)',
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

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

            <ExportCsvSlideover
                show={exportOpen}
                onClose={() => setExportOpen(false)}
                defaultYear={year}
                leaveTypes={leaveTypesForExport}
            />
        </AuthenticatedLayout>
    );
}
