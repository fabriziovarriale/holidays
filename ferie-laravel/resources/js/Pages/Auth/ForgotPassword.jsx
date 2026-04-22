import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Password dimenticata?"
            subtitle="Inserisci l'email dell'account: ti mandiamo un link per sceglierne una nuova."
        >
            <Head title="Password dimenticata" />

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
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
                            {errors.email}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
                    <Link
                        href={route('login')}
                        style={{
                            color: 'var(--h-ink)',
                            textDecoration: 'underline',
                            textUnderlineOffset: 3,
                            fontWeight: 600,
                            fontSize: 12.5,
                        }}
                    >
                        Torna all'accesso
                    </Link>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Invio…' : 'Invia link'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
