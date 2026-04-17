import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ApprovedLeaveImpactCalendar from '@/Components/ApprovedLeaveImpactCalendar';
import ConfirmDialog from '@/Components/ConfirmDialog';
import CreateRequestSlideover from '@/Components/CreateRequestSlideover';
import RequestDetailSlideover from '@/Components/RequestDetailSlideover';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard({
    user,
    year,
    leaveTypes,
    employeeBalance,
    employeeBalanceForLeaveStore = null,
    leaveStoreYear = new Date().getFullYear(),
    employeeRequests,
    employees = [],
    employeesWithBalances = {},
    approvedLeaveCalendar = [],
    companyHolidays = [],
    isAdmin = false,
    pendingRequests = [],
    approvedRequests = [],
    approvedMeta = null,
    rejectedRequests = [],
    rejectedMeta = null,
}) {
    const { errors = {}, flash = {}, impersonation = {} } = usePage().props;
    const [createSlideoverOpen, setCreateSlideoverOpen] = useState(false);

    const showFlashStatus =
        Boolean(flash.status) &&
        !(
            impersonation?.active &&
            typeof flash.status === 'string' &&
            flash.status.toLowerCase().includes('impersonaz')
        );

    const hasLeaveErrors = ['leaveType', 'startDate', 'endDate', 'requestedUnits', 'note', 'userId'].some((k) => errors?.[k]);
    useEffect(() => {
        if (hasLeaveErrors) setCreateSlideoverOpen(true);
    }, [hasLeaveErrors]);


    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Dashboard
                    </h2>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <a
                                href={route('admin.reports.export-leaves', { year: Number(year || new Date().getFullYear()) })}
                                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                                aria-label="Esporta CSV"
                                title="Esporta CSV"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                                </svg>
                                <span className="hidden sm:inline">Esporta CSV</span>
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => setCreateSlideoverOpen(true)}
                            className="inline-flex shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            Crea richiesta
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard - Ferie" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {showFlashStatus && (
                        <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                            {flash.status}
                        </div>
                    )}
                    {isAdmin ? (
                        <AdminView
                            pendingRequests={pendingRequests}
                            approvedRequests={approvedRequests}
                            approvedMeta={approvedMeta}
                            rejectedRequests={rejectedRequests}
                            rejectedMeta={rejectedMeta}
                        />
                    ) : (
                        <EmployeeView
                            balance={employeeBalance}
                            requests={employeeRequests}
                        />
                    )}
                    <ApprovedLeaveImpactCalendar approvedEntries={approvedLeaveCalendar} holidays={companyHolidays} />
                </div>
            </div>

            <CreateRequestSlideover
                show={createSlideoverOpen}
                onClose={() => setCreateSlideoverOpen(false)}
                leaveTypes={leaveTypes}
                employeeBalance={employeeBalance}
                employeeBalanceForLeaveStore={employeeBalanceForLeaveStore}
                leaveStoreYear={leaveStoreYear}
                employees={employees}
                employeesWithBalances={employeesWithBalances}
                isAdmin={isAdmin}
                errors={errors}
            />
        </AuthenticatedLayout>
    );
}

function BalanceBar({ balance }) {
    if (!balance || !balance.total) return null;
    const usedPct = Math.min(100, Math.round((balance.used / balance.total) * 100));
    const remainingPct = 100 - usedPct;
    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow">
            <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">Saldo ferie {new Date().getFullYear()}</span>
                <span className="text-muted-foreground">{balance.remaining} / {balance.total} residui</span>
            </div>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                {usedPct > 0 && (
                    <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${usedPct}%` }}
                        title={`Usati: ${balance.used}`}
                    />
                )}
                {remainingPct > 0 && (
                    <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${remainingPct}%` }}
                        title={`Residui: ${balance.remaining}`}
                    />
                )}
            </div>
            <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Usati: {balance.used}
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Residui: {balance.remaining}
                </span>
                <span className="flex items-center gap-1">
                    Totale: {balance.total}
                </span>
            </div>
        </div>
    );
}

function EmployeeView({ balance, requests }) {
    const [pendingCancelId, setPendingCancelId] = useState(null);
    const [cancelProcessing, setCancelProcessing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailSlideoverOpen, setDetailSlideoverOpen] = useState(false);

    const openDetail = (r) => {
        setSelectedRequest(r);
        setDetailSlideoverOpen(true);
    };

    const closeDetail = () => {
        setDetailSlideoverOpen(false);
        setSelectedRequest(null);
    };

    const handleCancel = () => {
        if (!pendingCancelId) return;
        setCancelProcessing(true);
        router.patch(route('leave-request.cancel', pendingCancelId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setCancelProcessing(false);
                setPendingCancelId(null);
                if (selectedRequest?.id === pendingCancelId) {
                    closeDetail();
                }
            },
            onError: () => setCancelProcessing(false),
        });
    };

    return (
        <div className="space-y-6">
            <BalanceBar balance={balance} />

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border-l-4 border-l-primary bg-primary/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Giorni totali</p>
                    <p className="text-2xl font-semibold text-foreground">{balance?.total ?? '-'}</p>
                </div>
                <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-500/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Giorni usati</p>
                    <p className="text-2xl font-semibold text-foreground">{balance?.used ?? '-'}</p>
                </div>
                <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Giorni residui</p>
                    <p className="text-2xl font-semibold text-foreground">{balance?.remaining ?? '-'}</p>
                </div>
            </section>

            <div className="rounded-lg bg-card border border-border p-4 shadow sm:p-6">
                <h3 className="text-lg font-medium text-foreground">Storico richieste</h3>
                <p className="mb-4 text-sm text-muted-foreground">Elenco richieste con stato</p>

                {requests.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nessuna richiesta</p>
                ) : (
                    <>
                        {/* Card layout — mobile */}
                        <ul className="space-y-3 sm:hidden">
                            {requests.map((r) => (
                                <li
                                    key={r.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openDetail(r)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openDetail(r);
                                        }
                                    }}
                                    className="cursor-pointer rounded-lg border border-border p-3 sm:p-4 outline-none hover:bg-accent/50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-foreground">{r.leaveType}</p>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {r.startDate} — {r.endDate}
                                            </p>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </div>
                                    {r.noteAdmin && (
                                        <p className="mt-2 text-xs italic text-muted-foreground">
                                            Nota: {r.noteAdmin}
                                        </p>
                                    )}
                                    {r.status === 'PENDING' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingCancelId(r.id);
                                            }}
                                            className="mt-3 text-xs text-destructive hover:underline"
                                        >
                                            Annulla richiesta
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Table layout — desktop */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 pl-0 text-left text-xs font-medium uppercase text-muted-foreground">Tipo</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Inizio</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Fine</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Stato</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Note admin</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {requests.map((r) => (
                                        <tr
                                            key={r.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openDetail(r)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    openDetail(r);
                                                }
                                            }}
                                            className="cursor-pointer outline-none transition-colors hover:bg-accent"
                                        >
                                            <td className="px-4 py-2 pl-0 text-foreground">{r.leaveType}</td>
                                            <td className="px-4 py-2 text-foreground">{r.startDate}</td>
                                            <td className="px-4 py-2 text-foreground">{r.endDate}</td>
                                            <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                                            <td className="px-4 py-2 text-sm text-muted-foreground">
                                                {r.noteAdmin ? <span className="italic">{r.noteAdmin}</span> : '—'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {r.status === 'PENDING' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPendingCancelId(r.id);
                                                        }}
                                                        className="text-xs text-destructive hover:underline"
                                                    >
                                                        Annulla
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog
                show={pendingCancelId !== null}
                title="Annulla richiesta"
                message="Annullare questa richiesta? L'operazione non può essere disfatta."
                confirmLabel="Sì, annulla"
                cancelLabel="Indietro"
                destructive
                processing={cancelProcessing}
                onConfirm={handleCancel}
                onCancel={() => setPendingCancelId(null)}
            />

            <RequestDetailSlideover
                request={selectedRequest}
                show={detailSlideoverOpen}
                onClose={closeDetail}
                variant="employee"
            />
        </div>
    );
}

function AdminView({ pendingRequests, approvedRequests, approvedMeta, rejectedRequests, rejectedMeta }) {
    const { flash = {} } = usePage().props;
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailSlideoverOpen, setDetailSlideoverOpen] = useState(false);

    const allRequests = [...pendingRequests, ...approvedRequests, ...rejectedRequests].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const openDetail = (r) => {
        setSelectedRequest(r);
        setDetailSlideoverOpen(true);
    };

    const closeDetail = () => {
        setDetailSlideoverOpen(false);
        setSelectedRequest(null);
    };

    useEffect(() => {
        const s = flash?.status;
        if (s && (s.includes('approvata') || s.includes('rifiutata'))) {
            setDetailSlideoverOpen(false);
            setSelectedRequest(null);
        }
    }, [flash?.status]);

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-500/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Richieste in attesa</p>
                    <p className="text-2xl font-semibold text-foreground">{pendingRequests.length}</p>
                </div>
                <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Richieste approvate</p>
                    <p className="text-2xl font-semibold text-foreground">{approvedRequests.length}</p>
                </div>
                <div className="rounded-lg border-l-4 border-l-rose-500 bg-rose-500/10 p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">Richieste rifiutate</p>
                    <p className="text-2xl font-semibold text-foreground">{rejectedRequests.length}</p>
                </div>
            </section>

            <div className="rounded-lg bg-card border border-border p-4 shadow sm:p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-foreground">Richieste</h3>
                    <p className="text-sm text-muted-foreground">Elenco di tutte le richieste con stato</p>
                </div>

                {allRequests.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nessuna richiesta</p>
                ) : (
                    <>
                        {/* Card layout — mobile */}
                        <ul className="space-y-3 sm:hidden">
                            {allRequests.map((r) => (
                                <li
                                    key={r.id}
                                    onClick={() => openDetail(r)}
                                    className="cursor-pointer rounded-lg border border-border p-3 sm:p-4 hover:bg-accent/50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-foreground">{r.userFullName}</p>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {r.leaveType} · {r.startDate} — {r.endDate}
                                            </p>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Table layout — desktop */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 pl-0 text-left text-xs font-medium uppercase text-muted-foreground">Dipendente</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Tipo</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Periodo</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Stato</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allRequests.map((r) => (
                                        <tr
                                            key={r.id}
                                            onClick={() => openDetail(r)}
                                            className="cursor-pointer transition-colors hover:bg-accent"
                                        >
                                            <td className="px-4 py-2 pl-0 text-foreground">{r.userFullName}</td>
                                            <td className="px-4 py-2 text-foreground">{r.leaveType}</td>
                                            <td className="px-4 py-2 text-foreground">{r.startDate} - {r.endDate}</td>
                                            <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {(approvedMeta || rejectedMeta) && (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {approvedMeta && approvedMeta.lastPage > 1 && (
                        <PaginationBar
                            label="Approvate"
                            meta={approvedMeta}
                            pageParam="approved_page"
                        />
                    )}
                    {rejectedMeta && rejectedMeta.lastPage > 1 && (
                        <PaginationBar
                            label="Rifiutate"
                            meta={rejectedMeta}
                            pageParam="rejected_page"
                        />
                    )}
                </div>
            )}

            <RequestDetailSlideover
                request={selectedRequest}
                show={detailSlideoverOpen}
                onClose={closeDetail}
            />
        </div>
    );
}

function PaginationBar({ label, meta, pageParam }) {
    const goTo = (page) => {
        router.get(route('dashboard'), { [pageParam]: page }, { preserveScroll: true, preserveState: true });
    };
    return (
        <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2">
            <span className="font-medium">{label}:</span>
            <span>{meta.total} totali</span>
            <button
                type="button"
                disabled={meta.currentPage <= 1}
                onClick={() => goTo(meta.currentPage - 1)}
                className="rounded px-1 hover:bg-accent disabled:opacity-30"
            >
                ‹
            </button>
            <span>{meta.currentPage}/{meta.lastPage}</span>
            <button
                type="button"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => goTo(meta.currentPage + 1)}
                className="rounded px-1 hover:bg-accent disabled:opacity-30"
            >
                ›
            </button>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        PENDING: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
        APPROVED: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        REJECTED: 'bg-destructive/20 text-destructive',
        CANCELLED: 'bg-muted text-muted-foreground',
    };
    const labels = {
        PENDING: 'In attesa',
        APPROVED: 'Approvata',
        REJECTED: 'Rifiutata',
        CANCELLED: 'Annullata',
    };
    return (
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
}
