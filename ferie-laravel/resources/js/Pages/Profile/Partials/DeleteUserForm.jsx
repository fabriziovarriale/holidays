import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

export default function DeleteUserForm() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = () => {
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => { setConfirmOpen(false); },
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmOpen(false);
        clearErrors();
        reset();
    };

    return (
        <section>
            <header style={{ marginBottom: 14 }}>
                <h3 className="h-heading" style={{ fontSize: 18 }}>Zona pericolo</h3>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                    Una volta eliminato, tutti i dati del tuo account verranno rimossi definitivamente.
                    Scarica prima le informazioni che vuoi conservare.
                </p>
            </header>

            <Button
                type="button"
                onClick={() => setConfirmOpen(true)}
                style={{ background: 'var(--h-ink)', color: 'var(--h-bg)' }}
            >
                <Icon name="x" size={14} />
                Elimina account
            </Button>

            <ConfirmDialog
                show={confirmOpen}
                title="Elimina account"
                destructive
                processing={processing}
                onConfirm={deleteUser}
                onCancel={closeModal}
                confirmLabel="Elimina definitivamente"
                cancelLabel="Annulla"
                message={
                    <div style={{ display: 'grid', gap: 12 }}>
                        <p style={{ fontSize: 13 }}>
                            Questa operazione è irreversibile. Inserisci la tua password per confermare.
                        </p>
                        <div>
                            <label htmlFor="delete_password" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                                Password
                            </label>
                            <input
                                id="delete_password"
                                ref={passwordInput}
                                type="password"
                                className="h-input"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="La tua password"
                            />
                            <FieldError message={errors.password} />
                        </div>
                    </div>
                }
            />
        </section>
    );
}
