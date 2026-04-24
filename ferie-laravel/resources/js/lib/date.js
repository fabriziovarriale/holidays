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

const MESI_IT = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

/**
 * Formato narrativo per un periodo, tipo "21-24 Giugno" o
 * "28 Giugno — 3 Luglio 2026". L'anno compare solo se diverso da
 * quello corrente, o se inizio e fine sono su anni differenti.
 */
export function fmtPeriodIT(start, end) {
    const s = toDate(start);
    const e = toDate(end);
    if (!s && !e) return '—';
    if (!e || (s && s.getTime() === e.getTime())) {
        const only = s ?? e;
        const currentYear = new Date().getFullYear();
        const yearSuffix = only.getFullYear() !== currentYear ? ` ${only.getFullYear()}` : '';
        return `${only.getDate()} ${MESI_IT[only.getMonth()]}${yearSuffix}`;
    }
    if (!s) return `${e.getDate()} ${MESI_IT[e.getMonth()]} ${e.getFullYear()}`;

    const currentYear = new Date().getFullYear();
    const sameYear = s.getFullYear() === e.getFullYear();
    const sameMonth = sameYear && s.getMonth() === e.getMonth();
    const showYear = !sameYear || s.getFullYear() !== currentYear;

    if (sameMonth) {
        return `${s.getDate()}-${e.getDate()} ${MESI_IT[s.getMonth()]}${showYear ? ` ${e.getFullYear()}` : ''}`;
    }
    if (sameYear) {
        const startPart = `${s.getDate()} ${MESI_IT[s.getMonth()]}`;
        const endPart = `${e.getDate()} ${MESI_IT[e.getMonth()]}${showYear ? ` ${e.getFullYear()}` : ''}`;
        return `${startPart} — ${endPart}`;
    }
    return `${s.getDate()} ${MESI_IT[s.getMonth()]} ${s.getFullYear()} — ${e.getDate()} ${MESI_IT[e.getMonth()]} ${e.getFullYear()}`;
}
