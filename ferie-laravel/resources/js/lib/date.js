/**
 * Helpers di formattazione data per l'intera app.
 * Tutte le date sono mostrate in formato italiano gg/mm/aaaa.
 * Le funzioni accettano:
 *   - oggetto Date
 *   - stringa ISO (es. "2026-04-22T10:00:00+00:00")
 *   - stringa Y-m-d (es. "2026-04-22")
 * e restituiscono '—' se il valore è assente o non parsabile.
 */

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const s = String(value);
    // "YYYY-MM-DD" → forza parsing locale senza shift di timezone
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (ymdMatch) {
        const [, y, m, d] = ymdMatch;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n) {
    return String(n).padStart(2, '0');
}

/** gg/mm/aaaa — formato principale dell'app */
export function fmtDate(value) {
    const d = toDate(value);
    if (!d) return '—';
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** gg/mm/aaaa hh:mm — per timestamp (attività, cronologia, CSV) */
export function fmtDateTime(value) {
    const d = toDate(value);
    if (!d) return '—';
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** gg/mm — variante breve per celle dense (tabelle a colonne strette) */
export function fmtDateShort(value) {
    const d = toDate(value);
    if (!d) return '—';
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
