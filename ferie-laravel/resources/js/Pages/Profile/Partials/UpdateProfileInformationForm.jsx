import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

export default function UpdateProfileInformationForm({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name ?? '',
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section>
            <header style={{ marginBottom: 18 }}>
                <h3 className="h-heading" style={{ fontSize: 18 }}>Dati anagrafici</h3>
                <p className="h-muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Aggiorna il nome e l'indirizzo email del tuo account.
                </p>
            </header>

            <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
                <div>
                    <label htmlFor="name" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Nome e cognome
                    </label>
                    <input
                        id="name"
                        className="h-input"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                    />
                    <FieldError message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="h-input"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <FieldError message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div
                        className="h-card h-card-flat"
                        style={{ padding: 12, background: 'var(--h-yellow)' }}
                    >
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                            Il tuo indirizzo email non è verificato.
                        </div>
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            style={{
                                marginTop: 6,
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                color: 'var(--h-ink)',
                                textDecoration: 'underline',
                                textUnderlineOffset: 3,
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Invia di nuovo l'email di verifica
                        </Link>

                        {status === 'verification-link-sent' && (
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                                Un nuovo link di verifica è stato inviato.
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-300"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out duration-300"
                        leaveTo="opacity-0"
                    >
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-ok)' }}>
                            ✓ Salvato.
                        </span>
                    </Transition>
                    <Button type="submit" variant="primary" disabled={processing}>
                        <Icon name="check" size={14} />
                        {processing ? 'Salvataggio…' : 'Salva modifiche'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
