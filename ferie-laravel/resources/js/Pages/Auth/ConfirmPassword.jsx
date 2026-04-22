import Button from '@/Components/h/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Conferma password"
            subtitle="Area riservata: conferma la password per procedere."
        >
            <Head title="Conferma password" />

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
                            {errors.password}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Verifica…' : 'Conferma'}
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
