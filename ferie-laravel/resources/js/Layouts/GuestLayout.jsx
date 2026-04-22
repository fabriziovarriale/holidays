import { Link } from '@inertiajs/react';

export default function GuestLayout({ title, subtitle, children }) {
    return (
        <div
            className="h-root"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                background: 'var(--h-bg)',
            }}
        >
            <div style={{ width: '100%', maxWidth: 460 }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 20,
                        textDecoration: 'none',
                        color: 'var(--h-ink)',
                    }}
                >
                    <span
                        style={{
                            width: 40,
                            height: 40,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--h-coral)',
                            border: 'var(--h-bw) solid var(--h-line)',
                            borderRadius: 'var(--h-radius)',
                            boxShadow: 'var(--h-shadow-sm)',
                            fontFamily: 'var(--h-display)',
                            fontSize: 18,
                        }}
                    >
                        H
                    </span>
                    <span
                        className="h-display"
                        style={{ fontSize: 22, letterSpacing: '0.02em' }}
                    >
                        HOLIDAYS
                    </span>
                </Link>

                <div className="h-card h-card-lg" style={{ padding: '28px 28px 24px' }}>
                    {title && (
                        <h1
                            className="h-heading"
                            style={{ fontSize: 22, marginBottom: subtitle ? 6 : 20 }}
                        >
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p
                            className="h-muted"
                            style={{ fontSize: 13.5, marginBottom: 20, lineHeight: 1.5 }}
                        >
                            {subtitle}
                        </p>
                    )}
                    {children}
                </div>

                <p
                    className="h-muted"
                    style={{
                        fontSize: 11,
                        marginTop: 20,
                        textAlign: 'center',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}
                >
                    bitboss · gestionale ferie
                </p>
            </div>
        </div>
    );
}
