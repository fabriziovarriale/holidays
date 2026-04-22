import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section>
            <header style={{ marginBottom: 18 }}>
                <h3 className="h-heading" style={{ fontSize: 18 }}>Sicurezza</h3>
                <p className="h-muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Usa una password lunga e casuale per mantenere il tuo account sicuro.
                </p>
            </header>

            <form onSubmit={updatePassword} style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
                <div>
                    <label htmlFor="current_password" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Password attuale
                    </label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        className="h-input"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    <FieldError message={errors.current_password} />
                </div>

                <div>
                    <label htmlFor="password" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Nuova password
                    </label>
                    <input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        className="h-input"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    <FieldError message={errors.password} />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Conferma nuova password
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        className="h-input"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                    <FieldError message={errors.password_confirmation} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <Button type="submit" variant="primary" disabled={processing}>
                        <Icon name="lock" size={14} />
                        {processing ? 'Salvataggio…' : 'Aggiorna password'}
                    </Button>
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
                </div>
            </form>
        </section>
    );
}
