import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Accedi" subtitle="Entra con le credenziali bitboss.">
            <Head title="Accedi" />

            {status && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: '10px 12px',
                        border: '2px solid var(--h-line)',
                        background: 'var(--h-mint)',
                        borderRadius: 'var(--h-radius)',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    {status}
                </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label htmlFor="email" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="h-input"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <FieldError>{errors.email}</FieldError>}
                </div>

                <div>
                    <label htmlFor="password" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="h-input"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <FieldError>{errors.password}</FieldError>}
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        style={{
                            width: 18,
                            height: 18,
                            border: '2px solid var(--h-line)',
                            borderRadius: 3,
                            accentColor: 'var(--h-coral)',
                            cursor: 'pointer',
                        }}
                    />
                    Ricordami su questo dispositivo
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}>
                        <Link href={route('register')} style={linkStyle}>
                            Registrati
                        </Link>
                        {canResetPassword && (
                            <Link href={route('password.request')} style={linkStyle}>
                                Password dimenticata?
                            </Link>
                        )}
                    </div>

                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Accesso…' : 'Accedi'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}

const linkStyle = {
    color: 'var(--h-ink)',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    fontWeight: 600,
};

function FieldError({ children }) {
    return (
        <div
            style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--h-err)',
            }}
        >
            {children}
        </div>
    );
}
