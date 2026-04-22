import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verifica email"
            subtitle="Controlla la tua casella: ti abbiamo inviato un link per confermare l'indirizzo."
        >
            <Head title="Verifica email" />

            {status === 'verification-link-sent' && (
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
                    Un nuovo link di verifica è stato inviato al tuo indirizzo email.
                </div>
            )}

            <form onSubmit={submit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        style={{
                            background: 'transparent',
                            border: 0,
                            color: 'var(--h-ink)',
                            textDecoration: 'underline',
                            textUnderlineOffset: 3,
                            fontWeight: 600,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    >
                        Esci
                    </Link>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Invio…' : 'Rinvia email'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
