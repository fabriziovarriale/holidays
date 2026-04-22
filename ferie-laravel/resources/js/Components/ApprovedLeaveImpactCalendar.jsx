import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import Slideover from '@/Components/Slideover';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { format, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { useCallback, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';

const LEAVE_TYPE_TOKENS = {
    Ferie: { bg: 'var(--h-coral)', label: 'Ferie' },
    Malattia: { bg: 'var(--h-rose)', label: 'Malattia' },
    Permesso: { bg: 'var(--h-sky)', label: 'Permesso' },
};

function leaveTypeToken(type) {
    const key = Object.keys(LEAVE_TYPE_TOKENS).find((k) =>
        type?.toLowerCase().includes(k.toLowerCase())
    );
    return key
        ? LEAVE_TYPE_TOKENS[key]
        : { bg: 'var(--h-yellow)', label: type || 'Altro' };
}

function parseYmd(ymd) {
    return parse(ymd, 'yyyy-MM-dd', new Date());
}

function normalizeText(value) {
    return (value ?? '').toString().trim().toLowerCase();
}

function workingDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    let total = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) total += 1;
        cursor.setDate(cursor.getDate() + 1);
    }
    return total;
}

function groupEntriesByUser(entries) {
    if (!entries?.length) return [];
    const map = new Map();
    for (const e of entries) {
        if (!map.has(e.userFullName)) {
            map.set(e.userFullName, { userFullName: e.userFullName, types: [] });
        }
        const g = map.get(e.userFullName);
        if (!g.types.includes(e.leaveType)) g.types.push(e.leaveType);
    }
    return [...map.values()].map((g) => ({
        userFullName: g.userFullName,
        leaveType: g.types.join(' · '),
        primaryType: g.types[0],
    }));
}

function buildDetailRows(entries) {
    if (!entries?.length) return [];
    const map = new Map();
    for (const e of entries) {
        if (!map.has(e.requestId)) {
            map.set(e.requestId, {
                requestId: e.requestId,
                userFullName: e.userFullName,
                leaveType: e.leaveType,
                requestedUnits: e.requestedUnits > 0 ? e.requestedUnits : workingDaysBetween(e.startDate, e.endDate),
                primaryType: e.leaveType,
                createdAt: e.createdAt ?? null,
                approvedAt: e.approvedAt ?? null,
            });
        }
    }
    return [...map.values()];
}

function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, 'dd/MM/yyyy HH:mm');
}

function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildDayIndex(approvedEntries) {
    const byKey = {};
    for (const item of approvedEntries) {
        const start = parseYmd(item.startDate);
        const end = parseYmd(item.endDate);
        if (start > end) continue;
        const cursor = new Date(start);
        while (cursor <= end) {
            const key = format(cursor, 'yyyy-MM-dd');
            if (!byKey[key]) byKey[key] = [];
            byKey[key].push({
                requestId: item.id,
                userFullName: item.userFullName,
                leaveType: item.leaveType,
                requestedUnits: item.requestedUnits ?? 0,
                startDate: item.startDate,
                endDate: item.endDate,
                createdAt: item.createdAt ?? null,
                approvedAt: item.approvedAt ?? null,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
    }
    return byKey;
}

const MAX_NAMES_IN_CELL = 3;

export default function ApprovedLeaveImpactCalendar({ approvedEntries = [], holidays = [] }) {
    const [detailDay, setDetailDay] = useState(null);
    const [nameFilter, setNameFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);

    const holidaySet = useMemo(() => new Set(holidays), [holidays]);

    const allNames = useMemo(() => {
        const s = new Set(
            approvedEntries
                .map((e) => (e.userFullName ?? '').trim())
                .filter(Boolean)
        );
        return [...s].sort();
    }, [approvedEntries]);

    const allTypes = useMemo(() => {
        const s = new Set(
            approvedEntries
                .map((e) => (e.leaveType ?? '').trim())
                .filter(Boolean)
        );
        return [...s].sort();
    }, [approvedEntries]);

    const filteredEntries = useMemo(() => {
        const normalizedNameFilter = normalizeText(nameFilter);
        const normalizedTypeFilter = normalizeText(typeFilter);
        return approvedEntries.filter((e) => {
            if (normalizedNameFilter && normalizeText(e.userFullName) !== normalizedNameFilter) return false;
            if (normalizedTypeFilter && normalizeText(e.leaveType) !== normalizedTypeFilter) return false;
            return true;
        });
    }, [approvedEntries, nameFilter, typeFilter]);

    const byDateKey = useMemo(() => buildDayIndex(filteredEntries), [filteredEntries]);
    const byDateKeyRef = useRef(byDateKey);
    byDateKeyRef.current = byDateKey;

    const holidaySetRef = useRef(holidaySet);
    holidaySetRef.current = holidaySet;

    const detailKey = detailDay ? format(detailDay, 'yyyy-MM-dd') : null;
    const detailRaw = detailKey ? byDateKey[detailKey] ?? [] : [];
    const detailRows = buildDetailRows(detailRaw);

    const closeDetail = () => setDetailDay(null);

    const ImpactDay = useCallback((props) => {
        const { day, children, className, ...tdProps } = props;
        const key = format(day.date, 'yyyy-MM-dd');
        const raw = byDateKeyRef.current[key] ?? [];
        const entries = groupEntriesByUser(raw);
        const has = entries.length > 0;

        const dow = day.date.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isHoliday = holidaySetRef.current.has(key);
        const isNonWorking = isWeekend || isHoliday;

        const cellBg = has && !isNonWorking
            ? 'var(--h-mint)'
            : isNonWorking
                ? 'var(--h-bg-2)'
                : 'var(--h-surface)';

        const hatchStyle = isNonWorking ? {
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(10,10,10,0.10) 5px, rgba(10,10,10,0.10) 10px)',
        } : {};

        return (
            <td {...tdProps} className={[className, '!align-top'].filter(Boolean).join(' ')} style={{ padding: 3 }}>
                <div
                    onClick={() => setDetailDay(day.date)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        minHeight: '7.5rem',
                        height: '7.5rem',
                        padding: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid var(--h-line)',
                        borderRadius: 'var(--h-radius)',
                        background: cellBg,
                        color: 'var(--h-ink)',
                        ...hatchStyle,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>{children}</div>
                    {has && (
                        <div
                            className="hide-scrollbar"
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                paddingRight: 2,
                            }}
                        >
                            {entries.slice(0, MAX_NAMES_IN_CELL).map((e, i) => {
                                const token = leaveTypeToken(e.primaryType);
                                return (
                                    <div
                                        key={`${e.userFullName}-${i}`}
                                        title={`${e.userFullName} — ${e.leaveType}`}
                                        style={{
                                            display: 'flex',
                                            minWidth: 0,
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '2px 4px',
                                            border: '2px solid var(--h-line)',
                                            borderRadius: 4,
                                            background: 'var(--h-surface)',
                                        }}
                                    >
                                        <span
                                            style={{
                                                flexShrink: 0,
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: token.bg,
                                                border: '2px solid var(--h-line)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 9,
                                                fontFamily: 'var(--h-display)',
                                                color: 'var(--h-ink)',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {initials(e.userFullName)}
                                        </span>
                                        <span style={{ minWidth: 0, flex: 1, lineHeight: 1.2 }}>
                                            <span
                                                style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: 'var(--h-ink)',
                                                }}
                                            >
                                                {e.userFullName}
                                            </span>
                                            <span
                                                className="h-muted"
                                                style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: 10,
                                                }}
                                            >
                                                {e.leaveType}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                            {entries.length > MAX_NAMES_IN_CELL && (
                                <span className="h-muted" style={{ fontSize: 10, fontWeight: 600, paddingLeft: 2 }}>
                                    +{entries.length - MAX_NAMES_IN_CELL} altri
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </td>
        );
    }, []);

    return (
        <section className="h-card" style={{ padding: 22 }}>
            <div style={{ marginBottom: 14 }}>
                <h3 className="h-heading" style={{ fontSize: 18 }}>Calendario assenze approvate</h3>
                <p className="h-muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Clic su un giorno per aprire il dettaglio nel pannello laterale.
                </p>
            </div>

            {approvedEntries.length === 0 ? (
                <p className="h-muted" style={{ fontSize: 13 }}>Nessuna richiesta approvata da mostrare.</p>
            ) : (
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                        <button
                            type="button"
                            onClick={() => setNameDialogOpen(true)}
                            className="h-btn h-btn-sm"
                        >
                            <span className="h-muted">Dipendente:</span>
                            <span>{nameFilter || 'Tutti'}</span>
                            <Icon name="chevDown" size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeDialogOpen(true)}
                            className="h-btn h-btn-sm"
                        >
                            <span className="h-muted">Tipo assenza:</span>
                            <span>{typeFilter || 'Tutti'}</span>
                            <Icon name="chevDown" size={12} />
                        </button>
                        {(nameFilter || typeFilter) && (
                            <button
                                type="button"
                                onClick={() => { setNameFilter(''); setTypeFilter(''); }}
                                className="h-btn h-btn-sm h-btn-ghost"
                                style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
                            >
                                Azzera filtri
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
                        {Object.entries(LEAVE_TYPE_TOKENS).map(([label, { bg }]) => (
                            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <span
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: bg,
                                        border: '2px solid var(--h-line)',
                                    }}
                                />
                                {label}
                            </span>
                        ))}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <span
                                style={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid var(--h-line)',
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(10,10,10,0.3) 2px, rgba(10,10,10,0.3) 4px)',
                                }}
                            />
                            Weekend / festività
                        </span>
                    </div>

                    <div style={{ width: '100%', minWidth: 0, overflowX: 'auto', color: 'var(--h-ink)' }}>
                        <DayPicker
                            mode="single"
                            locale={it}
                            defaultMonth={new Date()}
                            selected={detailDay ?? undefined}
                            onSelect={(date) => {
                                if (!date) { closeDetail(); return; }
                                setDetailDay(date);
                            }}
                            numberOfMonths={1}
                            showOutsideDays
                            className="rdp-root rdp-impact-calendar w-full max-w-none"
                            classNames={{
                                months: 'flex w-full flex-col justify-center gap-8',
                                month: 'w-full min-w-0 space-y-3',
                                month_grid: 'w-full table-fixed',
                                weekdays: 'w-full',
                                week: 'w-full',
                                day: 'w-[14.28%]',
                                day_button: '!h-8 !w-8 !min-h-0 shrink-0 rounded-md text-sm font-semibold sm:!h-9 sm:!w-9',
                            }}
                            components={{ Day: ImpactDay }}
                        />
                    </div>

                    <Slideover
                        show={Boolean(detailDay)}
                        onClose={closeDetail}
                        title={detailDay ? format(detailDay, 'd MMMM yyyy', { locale: it }) : ''}
                    >
                        {detailDay && detailRows.length === 0 && (
                            <p className="h-muted" style={{ fontSize: 13 }}>
                                Nessuna assenza approvata in questa data.
                            </p>
                        )}
                        {detailDay && detailRows.length > 0 && (
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
                                {detailRows.map((row, idx) => {
                                    const token = leaveTypeToken(row.primaryType);
                                    return (
                                        <li
                                            key={`${row.requestId}-${idx}`}
                                            style={{
                                                display: 'flex',
                                                gap: 12,
                                                paddingBottom: 12,
                                                borderBottom: idx < detailRows.length - 1 ? '2px dashed var(--h-line)' : 'none',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    flexShrink: 0,
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    background: token.bg,
                                                    border: '2px solid var(--h-line)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontFamily: 'var(--h-display)',
                                                    fontSize: 13,
                                                    color: 'var(--h-ink)',
                                                }}
                                            >
                                                {initials(row.userFullName)}
                                            </span>
                                            <div style={{ minWidth: 0, fontSize: 13 }}>
                                                <div style={{ fontWeight: 700 }}>{row.userFullName}</div>
                                                <div className="h-muted">{row.leaveType}</div>
                                                <div className="h-muted">Giorni richiesti: <b className="h-mono" style={{ color: 'var(--h-ink)' }}>{row.requestedUnits}</b></div>
                                                <div className="h-muted">Richiesto il {formatDateTime(row.createdAt)}</div>
                                                <div className="h-muted">Approvato il {formatDateTime(row.approvedAt)}</div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Slideover>

                    <RadioFilterDialog
                        show={nameDialogOpen}
                        title="Filtra per dipendente"
                        allLabel="Tutti"
                        options={allNames}
                        value={nameFilter}
                        onChange={setNameFilter}
                        onClose={() => setNameDialogOpen(false)}
                    />

                    <RadioFilterDialog
                        show={typeDialogOpen}
                        title="Filtra per tipo assenza"
                        allLabel="Tutti"
                        options={allTypes}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        onClose={() => setTypeDialogOpen(false)}
                    />
                </>
            )}
        </section>
    );
}

function RadioFilterDialog({ show, title, allLabel, options, value, onChange, onClose }) {
    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClose={onClose}>
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="absolute inset-0"
                        style={{ background: 'rgba(10,10,10,0.45)' }}
                    />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <DialogPanel
                        className="h-card h-root"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: 440,
                            padding: 22,
                            background: 'var(--h-surface)',
                            color: 'var(--h-ink)',
                        }}
                    >
                        <h3 className="h-heading" style={{ fontSize: 18, marginBottom: 14 }}>{title}</h3>
                        <div style={{ maxHeight: '18rem', overflowY: 'auto', display: 'grid', gap: 4, paddingRight: 4 }}>
                            <label
                                style={{
                                    display: 'flex',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 10px',
                                    border: '2px solid transparent',
                                    borderRadius: 'var(--h-radius)',
                                    background: value === '' ? 'var(--h-bg-2)' : 'transparent',
                                }}
                            >
                                <input
                                    type="radio"
                                    name={title}
                                    checked={value === ''}
                                    onChange={() => onChange('')}
                                    style={{ accentColor: 'var(--h-coral)', width: 16, height: 16 }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{allLabel}</span>
                            </label>
                            {options.map((option) => (
                                <label
                                    key={option}
                                    style={{
                                        display: 'flex',
                                        cursor: 'pointer',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '8px 10px',
                                        border: '2px solid transparent',
                                        borderRadius: 'var(--h-radius)',
                                        background: value === option ? 'var(--h-bg-2)' : 'transparent',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={title}
                                        checked={value === option}
                                        onChange={() => onChange(option)}
                                        style={{ accentColor: 'var(--h-coral)', width: 16, height: 16 }}
                                    />
                                    <span style={{ fontSize: 13 }}>{option}</span>
                                </label>
                            ))}
                        </div>
                        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="primary" onClick={onClose}>
                                Chiudi
                            </Button>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
