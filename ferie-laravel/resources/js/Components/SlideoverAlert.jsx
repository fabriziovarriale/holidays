import Icon from '@/Components/h/Icon';

const VARIANT_BG = {
    warning: 'var(--h-yellow)',
    error: 'var(--h-rose)',
    info: 'var(--h-sky)',
};

/**
 * Alert banner in tema V1 Pragmatica: fondo piatto colorato + bordo solido.
 */
export default function SlideoverAlert({ variant = 'warning', title, body, action }) {
    const bg = VARIANT_BG[variant] ?? VARIANT_BG.warning;

    return (
        <div
            className="h-card h-card-flat"
            style={{
                padding: 14,
                background: bg,
                border: '3px solid var(--h-line)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                <Icon name="warning" size={14} />
                {title}
            </div>
            {body && (
                <div style={{ fontSize: 12, marginTop: 4 }}>{body}</div>
            )}
            {action && (
                action.href ? (
                    <a
                        href={action.href}
                        className="h-btn h-btn-sm"
                        style={{
                            marginTop: 10,
                            background: 'var(--h-ink)',
                            color: 'var(--h-bg)',
                            textDecoration: 'none',
                        }}
                    >
                        {action.label}
                        <Icon name="arrowR" size={12} />
                    </a>
                ) : (
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="h-btn h-btn-sm"
                        style={{
                            marginTop: 10,
                            background: 'var(--h-ink)',
                            color: 'var(--h-bg)',
                        }}
                    >
                        {action.label}
                        <Icon name="arrowR" size={12} />
                    </button>
                )
            )}
        </div>
    );
}
