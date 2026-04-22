import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import DatePickerField, { parseYmdToLocalDate } from '@/Components/DatePickerField';
import SlideoverAlert from '@/Components/SlideoverAlert';
import { useForm, usePage } from '@inertiajs/react';
import { addDays, startOfDay } from 'date-fns';
import { useEffect, useMemo, useRef } from 'react';

function workingDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) count++;
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

function FieldLabel({ htmlFor, children, optional }) {
    return (
        <label htmlFor={htmlFor} className="h-label" style={{ display: 'block', marginBottom: 6 }}>
            {children}
            {optional && (
                <span className="h-muted" style={{ textTransform: 'none', fontWeight: 400, marginLeft: 6 }}>
                    (facoltativo)
                </span>
            )}
        </label>
    );
}

export default function LeaveRequestForm({
    leaveTypes,
    employeeBalance,
    employeeBalanceForLeaveStore = null,
    leaveStoreYear = new Date().getFullYear(),
    employees = [],
    employeesWithBalances = {},
    isAdmin = false,
    errors: externalErrors = {},
    onSuccess,
    initialStartDate = '',
    initialEndDate = '',
}) {
    const { auth, adminEmployees = [], adminEmployeesWithBalances = {} } = usePage().props;
    const employeesFromProps = Array.isArray(employees) ? employees : Object.values(employees || {});
    const employeesList = employeesFromProps.length > 0 ? employeesFromProps : (Array.isArray(adminEmployees) ? adminEmployees : Object.values(adminEmployees || {}));
    const hasEmployees = employeesList.length > 0;
    const balancesMap = Object.keys(employeesWithBalances).length > 0 ? employeesWithBalances : adminEmployeesWithBalances;
    const isAdminUser = auth?.user?.role === 'admin';
    const showEmployeeSelect = hasEmployees || isAdmin || isAdminUser;

    const firstEmployeeId =
        showEmployeeSelect && hasEmployees && employeesList[0]?.id != null
            ? String(employeesList[0].id)
            : '';

    const { data, setData, post, reset, processing, errors: formErrors, transform } = useForm({
        userId: firstEmployeeId,
        leaveType: 'FERIE',
        startDate: initialStartDate ?? '',
        endDate: initialEndDate ?? '',
        requestedUnits: '0',
        attachment: null,
        sickCertificatePuc: '',
        note: '',
    });

    const errors = Object.keys(formErrors).length > 0 ? formErrors : externalErrors;

    const leaveTypesRef = useRef(leaveTypes);
    leaveTypesRef.current = leaveTypes;
    const flagsRef = useRef({ hasEmployees, isAdmin, isAdminUser });
    flagsRef.current = { hasEmployees, isAdmin, isAdminUser };

    useEffect(() => {
        transform((raw) => {
            const out = { ...raw };
            const lt = leaveTypesRef.current.find((l) => l.code === out.leaveType);
            if (!lt || lt.unit !== 'hours') {
                out.requestedUnits = '0';
            }
            const { hasEmployees: he, isAdmin: ia, isAdminUser: iu } = flagsRef.current;
            if (!(he || ia || iu)) {
                delete out.userId;
            }
            return out;
        });
    }, [transform]);

    useEffect(() => {
        if (initialStartDate) setData('startDate', initialStartDate);
        if (initialEndDate) setData('endDate', initialEndDate);
    }, [initialStartDate, initialEndDate, setData]);

    const selectedType = useMemo(
        () => leaveTypes.find((lt) => lt.code === data.leaveType),
        [leaveTypes, data.leaveType]
    );

    const displayBalance = useMemo(() => {
        if (showEmployeeSelect && data.userId) {
            return balancesMap[data.userId] ?? null;
        }
        return employeeBalanceForLeaveStore ?? employeeBalance;
    }, [showEmployeeSelect, data.userId, balancesMap, employeeBalanceForLeaveStore, employeeBalance]);

    const isSelfServiceEmployee = !isAdmin && !isAdminUser;
    const missingLeaveBudgetForStore =
        isSelfServiceEmployee &&
        selectedType?.deductsBalance &&
        selectedType?.unit === 'days' &&
        displayBalance == null;

    const estimatedDays = useMemo(() => {
        if (data.startDate && data.endDate) {
            return workingDaysBetween(data.startDate, data.endDate);
        }
        return null;
    }, [data.startDate, data.endDate]);

    const noticeMinStartDate = useMemo(() => {
        const notice = Number(selectedType?.noticeDaysRequired ?? 0);
        if (!notice || notice < 1) return new Date(2020, 0, 1);
        return startOfDay(addDays(new Date(), notice));
    }, [selectedType?.noticeDaysRequired]);

    const maxConsecutiveDays = useMemo(() => {
        const v = selectedType?.maxConsecutiveDays;
        if (v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }, [selectedType?.maxConsecutiveDays]);

    const isAttachmentRequired = Boolean(selectedType?.requiresAttachment);
    const startDateError = String(errors.startDate ?? '');
    const hasBudgetError = startDateError.includes('Budget ferie');
    const hasSickOverlapError = startDateError.includes('richiedere ferie o permesso');

    const submit = (e) => {
        e.preventDefault();
        post(route('leave-request.store'), {
            preserveScroll: true,
            forceFormData: data.attachment instanceof File,
            onSuccess: () => { reset(); onSuccess?.(); },
        });
    };

    const showWorkingDaysCard =
        selectedType?.unit === 'days' && data.startDate && data.endDate && estimatedDays != null;

    return (
        <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
            {showEmployeeSelect && (
                <div>
                    <FieldLabel htmlFor="userId">Dipendente</FieldLabel>
                    {hasEmployees ? (
                        <>
                            <select
                                id="userId"
                                className="h-select"
                                value={data.userId}
                                onChange={(e) => setData('userId', e.target.value)}
                            >
                                {employeesList.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.label}</option>
                                ))}
                            </select>
                            <FieldError message={errors.userId} />
                        </>
                    ) : (
                        <div className="h-muted" style={{ fontSize: 13 }}>
                            Nessun dipendente disponibile. Aggiungi utenti dalla pagina Utenti.
                        </div>
                    )}
                </div>
            )}

            <div>
                <FieldLabel>Tipo di assenza</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(leaveTypes.length, 4)}, 1fr)`, gap: 8 }}>
                    {leaveTypes.map((lt) => {
                        const active = data.leaveType === lt.code;
                        return (
                            <button
                                type="button"
                                key={lt.code}
                                onClick={() => setData('leaveType', lt.code)}
                                className="h-btn"
                                style={{
                                    padding: '12px 8px',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontSize: 12,
                                    background: active ? 'var(--h-coral)' : 'var(--h-surface)',
                                    color: 'var(--h-ink)',
                                    boxShadow: active ? 'var(--h-shadow-sm)' : 'none',
                                }}
                            >
                                <LeaveTypeTag code={lt.code} />
                                <span className="h-mono" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                                    {lt.unit === 'hours' ? 'ore' : 'giorni'}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <FieldError message={errors.leaveType} />
            </div>

            {selectedType?.unit === 'hours' && (
                <div>
                    <FieldLabel htmlFor="requestedUnits">Ore richieste</FieldLabel>
                    <input
                        id="requestedUnits"
                        type="number"
                        min={1}
                        className="h-input h-mono"
                        value={data.requestedUnits ?? ''}
                        onChange={(e) => setData('requestedUnits', e.target.value)}
                    />
                    <FieldError message={errors.requestedUnits} />
                </div>
            )}

            {data.leaveType === 'MALATTIA' && (
                <div>
                    <FieldLabel htmlFor="sickCertificatePuc">Numero PUC certificato</FieldLabel>
                    <input
                        id="sickCertificatePuc"
                        type="text"
                        className="h-input h-mono"
                        placeholder="2026-XXXXXXX"
                        value={data.sickCertificatePuc ?? ''}
                        onChange={(e) => setData('sickCertificatePuc', e.target.value)}
                        required
                    />
                    <div className="h-muted" style={{ fontSize: 11, marginTop: 4 }}>
                        Obbligatorio per le assenze per malattia (comunicazione INPS).
                    </div>
                    <FieldError message={errors.sickCertificatePuc} />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                    <FieldLabel htmlFor="startDate">Inizio</FieldLabel>
                    <DatePickerField
                        id="startDate"
                        value={data.startDate ?? ''}
                        onChange={(v) => setData('startDate', v)}
                        minDate={noticeMinStartDate}
                        required
                    />
                    {errors.startDate && !hasBudgetError && !hasSickOverlapError && (
                        <FieldError message={errors.startDate} />
                    )}
                </div>
                <div>
                    <FieldLabel htmlFor="endDate">Fine</FieldLabel>
                    <DatePickerField
                        id="endDate"
                        value={data.endDate ?? ''}
                        onChange={(v) => setData('endDate', v)}
                        minDate={parseYmdToLocalDate(data.startDate) ?? noticeMinStartDate}
                        required
                    />
                    <FieldError message={errors.endDate} />
                </div>
            </div>

            {showWorkingDaysCard && (
                <div
                    className="h-card h-card-flat"
                    style={{
                        padding: 14,
                        background: 'var(--h-bg-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <div>
                        <div className="h-mono h-muted" style={{ fontSize: 10, letterSpacing: '0.08em' }}>
                            GIORNI LAVORATIVI
                        </div>
                        <div className="h-display" style={{ fontSize: 32 }}>{estimatedDays}g</div>
                    </div>
                    <div style={{ flex: 1, fontSize: 12 }}>
                        <div>
                            Dal <b>{new Date(data.startDate).toLocaleDateString('it-IT')}</b> al{' '}
                            <b>{new Date(data.endDate).toLocaleDateString('it-IT')}</b>
                        </div>
                        <div className="h-muted">Esclusi weekend e festività.</div>
                        {displayBalance != null && selectedType?.deductsBalance && (
                            <div style={{ marginTop: 4 }}>
                                Residui disponibili: <b className="h-mono">{displayBalance.remaining}</b>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedType?.unit === 'days' &&
                maxConsecutiveDays != null &&
                estimatedDays != null &&
                estimatedDays > maxConsecutiveDays && (
                    <SlideoverAlert
                        variant="error"
                        title="Limite consecutivi superato"
                        body={`Superi il massimo consentito di ${maxConsecutiveDays} giorni consecutivi.`}
                    />
                )}

            {selectedType?.noticeDaysRequired > 0 && (
                <div className="h-muted" style={{ fontSize: 12 }}>
                    Preavviso richiesto: <b>{selectedType.noticeDaysRequired}</b> giorni.
                </div>
            )}

            {missingLeaveBudgetForStore && !hasBudgetError && (
                <SlideoverAlert
                    variant="warning"
                    title="Budget ferie non impostato"
                    body={`Non risulta un budget assegnato per il ${leaveStoreYear}. Contatta l'amministratore per impostare i giorni disponibili prima di inviare richieste che scalano il saldo.`}
                />
            )}

            {hasSickOverlapError && (
                <SlideoverAlert
                    variant="error"
                    title="Conflitto con malattia"
                    body={startDateError}
                />
            )}

            {isAttachmentRequired && (
                <div>
                    <FieldLabel htmlFor="attachment">Allegato (PDF/JPG/PNG · max 2MB)</FieldLabel>
                    <input
                        id="attachment"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setData('attachment', e.target.files?.[0] ?? null)}
                        className="h-input"
                        style={{ padding: 8 }}
                        required
                    />
                    <div className="h-muted" style={{ fontSize: 11, marginTop: 4 }}>
                        PDF o immagine (max 2MB).
                    </div>
                    <FieldError message={errors.attachment} />
                </div>
            )}

            {hasBudgetError && (
                <SlideoverAlert
                    variant="error"
                    title="Budget ferie non impostato"
                    body={
                        (isAdminUser || isAdmin) && data.userId
                            ? "Questo dipendente non ha ancora un budget assegnato per l'anno corrente."
                            : "Non risulta un budget ferie per te per l'anno corrente. Contatta l'amministratore per impostare i giorni disponibili."
                    }
                    action={
                        (isAdminUser || isAdmin) && data.userId
                            ? {
                                label: 'Imposta budget ora',
                                href: `${route('admin.users.index')}?openUser=${data.userId}`,
                            }
                            : undefined
                    }
                />
            )}

            <div>
                <FieldLabel htmlFor="note" optional>Nota per l'admin</FieldLabel>
                <textarea
                    id="note"
                    className="h-textarea"
                    rows={3}
                    value={data.note ?? ''}
                    onChange={(e) => setData('note', e.target.value)}
                    placeholder="Es. matrimonio di un amico, visita medica..."
                />
                <FieldError message={errors.note} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <Button type="button" variant="ghost" onClick={onSuccess} disabled={processing}>
                    Annulla
                </Button>
                <Button type="submit" variant="primary" disabled={processing}>
                    <Icon name="check" size={14} />
                    {processing ? 'Invio…' : 'Invia richiesta'}
                </Button>
            </div>
        </form>
    );
}
