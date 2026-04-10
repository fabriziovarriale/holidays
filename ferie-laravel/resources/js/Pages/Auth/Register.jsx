import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
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
        <GuestLayout>
            <Head title="Registrazione" />

            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="first_name" value="Nome" />
                        <TextInput
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="mt-1 block w-full"
                            autoComplete="given-name"
                            isFocused={true}
                            onChange={(e) => setData('first_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.first_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="last_name" value="Cognome" />
                        <TextInput
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="mt-1 block w-full"
                            autoComplete="family-name"
                            onChange={(e) => setData('last_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.last_name} className="mt-2" />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="job_role" value="Ruolo" />
                    <select
                        id="job_role"
                        name="job_role"
                        value={data.job_role}
                        onChange={(e) => setData('job_role', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">Seleziona ruolo…</option>
                        {JOB_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <InputError message={errors.job_role} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Conferma password" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center justify-end gap-4 pt-2">
                    <Link
                        href={route('login')}
                        className="text-sm text-muted-foreground underline hover:text-foreground"
                    >
                        Hai già un account?
                    </Link>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Registrazione…' : 'Registrati'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
