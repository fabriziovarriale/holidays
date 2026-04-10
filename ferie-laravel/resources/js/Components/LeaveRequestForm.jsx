import DatePickerField, { parseYmdToLocalDate } from '@/Components/DatePickerField';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import Textarea from '@/Components/Textarea';
import { Link, useForm, usePage } from '@inertiajs/react';
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

export default function LeaveRequestForm({
    leaveTypes,
    employeeBalance,
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
        return employeeBalance;
    }, [showEmployeeSelect, data.userId, balancesMap, employeeBalance]);

    const estimatedDays = useMemo(() => {
        if (data.startDate && data.endDate) {
            return workingDaysBetween(data.startDate, data.endDate);
        }
        return null;
    }, [data.startDate, data.endDate]);

    const submit = (e) => {
        e.preventDefault();
        post(route('leave-request.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onSuccess?.(); },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {showEmployeeSelect && (
                <div>
                    <InputLabel htmlFor="userId" value="Dipendente" />
                    {hasEmployees ? (
                        <>
                            <Select
                                id="userId"
                                value={data.userId}
                                onChange={(v) => setData('userId', v)}
                                options={employeesList}
                                optionValue="id"
                                optionLabel="label"
                            />
                            <InputError message={errors.userId} className="mt-2" />
                        </>
                    ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Nessun dipendente disponibile. Aggiungi utenti dalla pagina Utenti.
                        </p>
                    )}
                </div>
            )}

            <p className="text-sm text-muted-foreground">
                In MVP i giorni lavorativi saranno ricalcolati lato database in fase di approvazione.
            </p>

            <div>
                <InputLabel htmlFor="leaveType" value="Tipo assenza" />
                <Select
                    id="leaveType"
                    value={data.leaveType}
                    onChange={(v) => setData('leaveType', v)}
                    options={leaveTypes}
                    optionValue="code"
                    optionLabel="label"
                />
                <InputError message={errors.leaveType} className="mt-2" />
            </div>

            {selectedType?.unit === 'hours' && (
                <div>
                    <InputLabel htmlFor="requestedUnits" value="Ore richieste" />
                    <TextInput
                        id="requestedUnits"
                        type="number"
                        min={1}
                        value={data.requestedUnits ?? ''}
                        onChange={(e) => setData('requestedUnits', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.requestedUnits} className="mt-2" />
                </div>
            )}

            {selectedType?.deductsBalance &&
                selectedType?.unit === 'days' &&
                data.startDate &&
                data.endDate && (
                    <p className="text-sm text-muted-foreground">
                        Giorni lavorativi stimati: <strong>{estimatedDays}</strong>
                        {displayBalance != null && (
                            <> • Residui: {displayBalance.remaining}</>
                        )}
                    </p>
                )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="startDate" value="Data inizio" />
                    <DatePickerField
                        id="startDate"
                        value={data.startDate ?? ''}
                        onChange={(v) => setData('startDate', v)}
                        minDate={new Date(2020, 0, 1)}
                        required
                    />
                    {errors.startDate && (
                        errors.startDate.includes('Budget ferie') && (isAdminUser || isAdmin) && data.userId ? (
                            <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                <span>Budget ferie non impostato per questo dipendente.{' '}</span>
                                <Link
                                    href={`${route('admin.users.index')}?openUser=${data.userId}`}
                                    className="shrink-0 font-semibold underline hover:opacity-80"
                                >
                                    Imposta ora →
                                </Link>
                            </div>
                        ) : (
                            <InputError message={errors.startDate} className="mt-2" />
                        )
                    )}
                </div>
                <div>
                    <InputLabel htmlFor="endDate" value="Data fine" />
                    <DatePickerField
                        id="endDate"
                        value={data.endDate ?? ''}
                        onChange={(v) => setData('endDate', v)}
                        minDate={parseYmdToLocalDate(data.startDate) ?? new Date(2020, 0, 1)}
                        required
                    />
                    <InputError message={errors.endDate} className="mt-2" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="note" value="Note opzionali" />
                <Textarea
                    id="note"
                    value={data.note ?? ''}
                    onChange={(e) => setData('note', e.target.value)}
                    rows={3}
                    placeholder="Es. visita medica"
                />
                <InputError message={errors.note} className="mt-2" />
            </div>

            <div className="flex gap-3 pt-2">
                <PrimaryButton disabled={processing}>
                    {processing ? 'Invio...' : 'Invia richiesta'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onSuccess}>
                    Annulla
                </SecondaryButton>
            </div>
        </form>
    );
}
