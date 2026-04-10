import ConfirmDialog from '@/Components/ConfirmDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

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
            <header className="mb-6">
                <h3 className="text-base font-semibold text-foreground">Elimina account</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Una volta eliminato, tutti i dati del tuo account verranno rimossi definitivamente.
                </p>
            </header>

            <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
                Elimina account
            </button>

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
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Questa operazione è irreversibile. Inserisci la tua password per confermare.
                        </p>
                        <div>
                            <InputLabel htmlFor="delete_password" value="Password" className="sr-only" />
                            <TextInput
                                id="delete_password"
                                type="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="block w-full"
                                placeholder="La tua password"
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    </div>
                }
            />
        </section>
    );
}
