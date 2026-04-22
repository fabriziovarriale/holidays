import Icon from '@/Components/h/Icon';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';

/** Converte yyyy-MM-dd in Date locale (mezzanotte), senza shift UTC. */
export function parseYmdToLocalDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export default function DatePickerField({
    id,
    value,
    onChange,
    disabled = false,
    required = false,
    placeholder = 'Seleziona data',
    className = '',
    minDate,
    maxDate,
}) {
    const selected = parseYmdToLocalDate(value);
    const display = selected
        ? format(selected, 'd MMM yyyy', { locale: it })
        : placeholder;

    const isDateDisabled = (date) => {
        const day = startOfDay(date);
        if (minDate && isBefore(day, startOfDay(minDate))) return true;
        if (maxDate && isAfter(day, startOfDay(maxDate))) return true;
        return false;
    };

    return (
        <Popover className={`relative ${className}`} style={{ position: 'relative' }}>
            <PopoverButton
                id={id}
                type="button"
                disabled={disabled}
                className="h-input"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    color: selected ? 'var(--h-ink)' : 'var(--h-muted)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    background: 'var(--h-surface)',
                }}
            >
                <span style={{ fontWeight: selected ? 600 : 400 }}>{display}</span>
                <Icon name="cal" size={16} />
            </PopoverButton>

            {required && (
                <input
                    type="text"
                    required
                    value={value || ''}
                    readOnly
                    tabIndex={-1}
                    aria-hidden
                    style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: 1,
                        width: 1,
                        opacity: 0,
                    }}
                />
            )}

            <PopoverPanel
                anchor={{ to: 'bottom start', gap: 6 }}
                className="h-card h-root"
                style={{
                    zIndex: 100,
                    padding: 10,
                    background: 'var(--h-surface)',
                    color: 'var(--h-ink)',
                }}
            >
                {({ close }) => (
                    <DayPicker
                        mode="single"
                        locale={it}
                        selected={selected}
                        defaultMonth={selected ?? new Date()}
                        onSelect={(date) => {
                            if (date) {
                                onChange(format(date, 'yyyy-MM-dd'));
                                close();
                            }
                        }}
                        disabled={isDateDisabled}
                        showOutsideDays
                        className="rdp-root"
                    />
                )}
            </PopoverPanel>
        </Popover>
    );
}
