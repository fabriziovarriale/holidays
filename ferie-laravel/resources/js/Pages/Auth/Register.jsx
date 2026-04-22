import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const JOB_ROLES = ['Designer', 'PM', 'Developer', 'Socio'];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        job_role: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Registrati" subtitle="Crea un account per richiedere ferie e permessi.">
            <Head title="Registrazione" />

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Nome" htmlFor="first_name" error={errors.first_name}>
                        <input
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="h-input"
                            autoComplete="given-name"
                            autoFocus
                            required
                            onChange={(e) => setData('first_name', e.target.value)}
                        />
                    </Field>
                    <Field label="Cognome" htmlFor="last_name" error={errors.last_name}>
                        <input
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="h-input"
                            autoComplete="family-name"
                            required
                            onChange={(e) => setData('last_name', e.target.value)}
                        />
                    </Field>
                </div>

                <Field label="Ruolo" htmlFor="job_role" error={errors.job_role}>
                    <select
                        id="job_role"
                        name="job_role"
                        value={data.job_role}
                        onChange={(e) => setData('job_role', e.target.value)}
                        required
                        className="h-select"
                    >
                        <option value="">Seleziona ruolo…</option>
                        {JOB_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Email" htmlFor="email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="h-input"
                        autoComplete="username"
                        required
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
                        required
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
                        required
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </Field>

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
                        Hai già un account?
                    </Link>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Registrazione…' : 'Registrati'}
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
