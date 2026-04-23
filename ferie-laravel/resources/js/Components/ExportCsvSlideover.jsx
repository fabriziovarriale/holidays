import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import Select from '@/Components/h/Select';
import Slideover from '@/Components/Slideover';
import { useMemo, useState } from 'react';

const DATASETS = [
    {
        value: 'richieste',
        label: 'Richieste dettagliate',
        description: "Una riga per richiesta. Utile per audit HR e gestione paghe.",
        columns: [
            { key: 'dipendente',      label: 'Dipendente' },
            { key: 'email',           label: 'Email' },
            { key: 'ruolo',           label: 'Ruolo professionale' },
            { key: 'tipo',            label: 'Tipo assenza' },
            { key: 'inizio',          label: 'Data inizio' },
            { key: 'fine',            label: 'Data fine' },
            { key: 'unita',           label: 'Unità (giorni/ore)' },
            { key: 'quantita',        label: 'Quantità' },
            { key: 'stato',           label: 'Stato' },
            { key: 'inviata_il',      label: 'Data invio' },
            { key: 'approvata_il',    label: 'Data decisione' },
            { key: 'nota_dipendente', label: 'Nota dipendente' },
            { key: 'nota_admin',      label: 'Nota admin' },
            { key: 'allegato',        label: 'Allegato (sì/no)' },
            { key: 'puc',             label: 'PUC malattia' },
        ],
        supportsStatusTypeFilters: true,
    },
    {
        value: 'saldi',
        label: 'Saldo ferie dipendenti',
        description: "Una riga per dipendente attivo: budget, usati e residui dell'anno.",
        columns: [
            { key: 'dipendente', label: 'Dipendente' },
            { key: 'email',      label: 'Email' },
            { key: 'ruolo',      label: 'Ruolo professionale' },
            { key: 'allocati',   label: 'Giorni allocati' },
            { key: 'usati',      label: 'Giorni usati' },
            { key: 'residui',    label: 'Giorni residui' },
        ],
        supportsStatusTypeFilters: false,
    },
    {
        value: 'mensile',
        label: 'Aggregato mensile',
        description: "Una riga per mese. Totali ferie/malattia/permessi approvati.",
        columns: [
            { key: 'mese',             label: 'Mese' },
            { key: 'ferie_giorni',     label: 'Ferie (giorni)' },
            { key: 'malattia_giorni',  label: 'Malattia (giorni)' },
            { key: 'permesso_ore',     label: 'Permessi (ore)' },
            { key: 'richieste_totali', label: 'Totale richieste approvate' },
        ],
        supportsStatusTypeFilters: false,
    },
];

const STATUSES = [
    { value: 'PENDING',   label: 'In attesa' },
    { value: 'APPROVED',  label: 'Approvate' },
    { value: 'REJECTED',  label: 'Rifiutate' },
    { value: 'CANCELLED', label: 'Annullate' },
];

const TYPES = [
    { value: 'FERIE',    label: 'Ferie' },
    { value: 'PERMESSO', label: 'Permessi' },
    { value: 'MALATTIA', label: 'Malattia' },
    { value: 'ROL',      label: 'ROL' },
];

function Check({ id, checked, onChange, children }) {
    return (
        <label
            htmlFor={id}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: '2px solid var(--h-line)',
                borderRadius: 'var(--h-radius)',
                background: checked ? 'var(--h-bg-2)' : 'var(--h-surface)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: checked ? 700 : 500,
            }}
        >
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ accentColor: 'var(--h-coral)', width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ flex: 1 }}>{children}</span>
        </label>
    );
}

export default function ExportCsvSlideover({ show, onClose, defaultYear }) {
    const currentYear = defaultYear ?? new Date().getFullYear();

    const [dataset, setDatasetValue] = useState('richieste');
    const [year, setYear] = useState(currentYear);
    const [statuses, setStatuses] = useState(() => STATUSES.map((s) => s.value));
    const [types, setTypes] = useState(() => TYPES.map((t) => t.value));

    const currentDataset = useMemo(
        () => DATASETS.find((d) => d.value === dataset) ?? DATASETS[0],
        [dataset]
    );

    const [selectedColumns, setSelectedColumns] = useState(() =>
        currentDataset.columns.map((c) => c.key)
    );

    const setDataset = (value) => {
        setDatasetValue(value);
        const next = DATASETS.find((d) => d.value === value);
        if (next) setSelectedColumns(next.columns.map((c) => c.key));
    };

    const toggleInList = (list, value) =>
        list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

    const toggleColumn = (key) => setSelectedColumns((prev) => toggleInList(prev, key));
    const toggleStatus = (value) => setStatuses((prev) => toggleInList(prev, value));
    const toggleType = (value) => setTypes((prev) => toggleInList(prev, value));

    const allColumns = () => setSelectedColumns(currentDataset.columns.map((c) => c.key));
    const noColumns = () => setSelectedColumns([]);

    const canExport = selectedColumns.length > 0 &&
        (!currentDataset.supportsStatusTypeFilters || (statuses.length > 0 && types.length > 0));

    const handleExport = () => {
        const url = new URL(route('admin.reports.export-leaves'), window.location.origin);
        url.searchParams.set('dataset', dataset);
        url.searchParams.set('year', String(year));
        for (const col of selectedColumns) url.searchParams.append('columns[]', col);
        if (currentDataset.supportsStatusTypeFilters) {
            for (const s of statuses) url.searchParams.append('statuses[]', s);
            for (const t of types) url.searchParams.append('types[]', t);
        }
        window.location.href = url.toString();
        onClose?.();
    };

    return (
        <Slideover
            show={show}
            onClose={onClose}
            title="Esporta CSV"
            size="lg"
            footer={
                <>
                    <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleExport}
                        disabled={!canExport}
                    >
                        <Icon name="download" size={14} />
                        Scarica CSV
                    </Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 22 }}>
                <section>
                    <div className="h-label" style={{ marginBottom: 8 }}>Dataset</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {DATASETS.map((d) => {
                            const active = d.value === dataset;
                            return (
                                <button
                                    type="button"
                                    key={d.value}
                                    onClick={() => setDataset(d.value)}
                                    className="h-btn"
                                    style={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 4,
                                        padding: '12px 14px',
                                        textAlign: 'left',
                                        background: active ? 'var(--h-coral)' : 'var(--h-surface)',
                                        color: 'var(--h-ink)',
                                        boxShadow: active ? 'var(--h-shadow-sm)' : 'none',
                                    }}
                                >
                                    <span style={{ fontWeight: 800, fontSize: 14 }}>{d.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 500 }}>{d.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="h-label" style={{ marginBottom: 8 }}>Anno</div>
                    <Select
                        value={String(year)}
                        onChange={(v) => setYear(Number(v))}
                        options={[currentYear - 1, currentYear, currentYear + 1].map((y) => ({
                            value: String(y),
                            label: String(y),
                        }))}
                        style={{ maxWidth: 160 }}
                    />
                </section>

                {currentDataset.supportsStatusTypeFilters && (
                    <>
                        <section>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div className="h-label">Stati da includere</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setStatuses(STATUSES.map((s) => s.value))}
                                        className="h-btn h-btn-sm h-btn-ghost"
                                        style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                                    >
                                        Tutti
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatuses([])}
                                        className="h-btn h-btn-sm h-btn-ghost"
                                        style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                                    >
                                        Nessuno
                                    </button>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                    gap: 8,
                                }}
                            >
                                {STATUSES.map((s) => (
                                    <Check
                                        key={s.value}
                                        id={`status-${s.value}`}
                                        checked={statuses.includes(s.value)}
                                        onChange={() => toggleStatus(s.value)}
                                    >
                                        {s.label}
                                    </Check>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div className="h-label">Tipi da includere</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setTypes(TYPES.map((t) => t.value))}
                                        className="h-btn h-btn-sm h-btn-ghost"
                                        style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                                    >
                                        Tutti
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTypes([])}
                                        className="h-btn h-btn-sm h-btn-ghost"
                                        style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                                    >
                                        Nessuno
                                    </button>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                    gap: 8,
                                }}
                            >
                                {TYPES.map((t) => (
                                    <Check
                                        key={t.value}
                                        id={`type-${t.value}`}
                                        checked={types.includes(t.value)}
                                        onChange={() => toggleType(t.value)}
                                    >
                                        {t.label}
                                    </Check>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                <section>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className="h-label">
                            Colonne
                            <span className="h-muted" style={{ fontSize: 11, textTransform: 'none', fontWeight: 500, marginLeft: 8 }}>
                                {selectedColumns.length}/{currentDataset.columns.length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                onClick={allColumns}
                                className="h-btn h-btn-sm h-btn-ghost"
                                style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                            >
                                Tutte
                            </button>
                            <button
                                type="button"
                                onClick={noColumns}
                                className="h-btn h-btn-sm h-btn-ghost"
                                style={{ fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 3 }}
                            >
                                Nessuna
                            </button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 8,
                        }}
                    >
                        {currentDataset.columns.map((col) => (
                            <Check
                                key={col.key}
                                id={`col-${col.key}`}
                                checked={selectedColumns.includes(col.key)}
                                onChange={() => toggleColumn(col.key)}
                            >
                                {col.label}
                            </Check>
                        ))}
                    </div>
                </section>

                {!canExport && (
                    <div
                        className="h-card h-card-flat"
                        style={{ padding: 12, background: 'var(--h-yellow)' }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                            <Icon name="warning" size={12} /> Seleziona almeno una colonna
                            {currentDataset.supportsStatusTypeFilters ? ', uno stato e un tipo' : ''} per esportare.
                        </div>
                    </div>
                )}
            </div>
        </Slideover>
    );
}
