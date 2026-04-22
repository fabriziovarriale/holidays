import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import Slideover from '@/Components/Slideover';
import { useForm } from '@inertiajs/react';

const JOB_ROLES = ['Designer', 'PM', 'Developer', 'Socio'];

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--h-err)' }}>
            {message}
        </div>
    );
}

export default function CreateUserSlideover({ show, onClose }) {
    const { data, setData, post, reset, processing, errors } = useForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        password_confirmation: '',
        jobRole: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => { reset(); onClose?.(); },
        });
    };

    return (
        <Slideover
            show={show}
            onClose={onClose}
            title="Nuovo utente"
            footer={
                <>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>
                        Annulla
                    </Button>
                    <Button type="submit" form="createUserForm" variant="primary" disabled={processing}>
                        <Icon name="check" size={14} />
                        {processing ? 'Creazione…' : 'Crea utente'}
                    </Button>
                </>
            }
        >
            <form id="createUserForm" onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label htmlFor="firstName" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                            Nome
                        </label>
                        <input
                            id="firstName"
                            className="h-input"
                            value={data.firstName}
                            onChange={(e) => setData('firstName', e.target.value)}
                            required
                        />
                        <FieldError message={errors.firstName} />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                            Cognome
                        </label>
                        <input
                            id="lastName"
                            className="h-input"
                            value={data.lastName}
                            onChange={(e) => setData('lastName', e.target.value)}
                            required
                        />
                        <FieldError message={errors.lastName} />
                    </div>
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
                    />
                    <FieldError message={errors.email} />
                </div>

                <div>
                    <label htmlFor="jobRole" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                        Ruolo professionale
                    </label>
                    <select
                        id="jobRole"
                        className="h-select"
                        value={data.jobRole}
                        onChange={(e) => setData('jobRole', e.target.value)}
                    >
                        <option value="">Seleziona ruolo…</option>
                        {JOB_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <FieldError message={errors.jobRole} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label htmlFor="password" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="h-input"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <FieldError message={errors.password} />
                    </div>
                    <div>
                        <label htmlFor="password_confirmation" className="h-label" style={{ display: 'block', marginBottom: 6 }}>
                            Conferma password
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            className="h-input"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <FieldError message={errors.password_confirmation} />
                    </div>
                </div>
            </form>
        </Slideover>
    );
}
