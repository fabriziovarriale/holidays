import Icon from '@/Components/h/Icon';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

/**
 * Select custom in tema V1 Pragmatica.
 * Rimpiazza il <select> nativo (che apre un menu OS non stilabile) con un
 * trigger ad aspetto `.h-select` e un pannello flottante `.h-card`.
 *
 * Props:
 * - value: valore corrente
 * - onChange(value): callback al cambio selezione
 * - options: [{ value, label }] oppure stringhe
 * - placeholder: testo mostrato se nessun valore è selezionato
 * - disabled, id, className, style, buttonStyle
 */
export default function Select({
    value,
    onChange,
    options = [],
    placeholder = 'Seleziona…',
    disabled = false,
    id,
    className = '',
    style,
    buttonStyle,
}) {
    const normalized = options.map((opt) =>
        typeof opt === 'string' || typeof opt === 'number'
            ? { value: opt, label: String(opt) }
            : opt
    );

    const selected = normalized.find((opt) => String(opt.value) === String(value));
    const label = selected?.label ?? '';
    const isEmpty = label === '' || label == null;

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={className} style={{ position: 'relative', ...style }}>
                <ListboxButton
                    id={id}
                    className="h-select"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                        background: 'var(--h-surface)',
                        color: isEmpty ? 'var(--h-muted)' : 'var(--h-ink)',
                        fontWeight: isEmpty ? 400 : 600,
                        gap: 10,
                        ...buttonStyle,
                    }}
                >
                    <span
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                        }}
                    >
                        {isEmpty ? placeholder : label}
                    </span>
                    <Icon name="chevDown" size={14} />
                </ListboxButton>

                <ListboxOptions
                    anchor={{ to: 'bottom start', gap: 6 }}
                    className="h-card h-root h-scroll"
                    style={{
                        zIndex: 100,
                        padding: 6,
                        background: 'var(--h-surface)',
                        color: 'var(--h-ink)',
                        minWidth: 'var(--button-width)',
                        maxHeight: 320,
                        overflowY: 'auto',
                        outline: 'none',
                    }}
                >
                    {normalized.length === 0 && (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--h-muted)' }}>
                            Nessuna opzione disponibile.
                        </div>
                    )}
                    {normalized.map((opt) => (
                        <ListboxOption
                            key={String(opt.value)}
                            value={opt.value}
                            disabled={opt.disabled}
                            style={({ focus, selected: sel }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 10px',
                                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                borderRadius: 'var(--h-radius)',
                                background: sel
                                    ? 'var(--h-coral)'
                                    : focus
                                        ? 'var(--h-bg-2)'
                                        : 'transparent',
                                color: 'var(--h-ink)',
                                fontSize: 13,
                                fontWeight: sel ? 700 : 500,
                                opacity: opt.disabled ? 0.5 : 1,
                                outline: 'none',
                            })}
                        >
                            {({ selected: sel }) => (
                                <>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            width: 14,
                                            height: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {sel ? <Icon name="check" size={12} /> : null}
                                    </span>
                                    <span
                                        style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {opt.label}
                                    </span>
                                </>
                            )}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}
