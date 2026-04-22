import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Nuova password"
            subtitle="Scegli una password sicura per il tuo account."
        >
            <Head title="Reset password" />

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Email" htmlFor="email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="h-input"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </Field>

                <Field label="Password" htmlFor="password" error={errors.password}>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="h-input"
                        autoComplete="new-password"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>

                <Field
                    label="Conferma password"
                    htmlFor="password_confirmation"
                    error={errors.password_confirmation}
                >
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="h-input"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </Field>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Imposta password'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}

function Field({ label, htmlFor, error, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                {label}
            </label>
            {children}
            {error && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
                    {error}
                </div>
            )}
        </div>
    );
}
