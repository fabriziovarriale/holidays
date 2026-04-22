import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/h/Button';
import Icon from '@/Components/h/Icon';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function initialsOf(user) {
    if (!user) return '—';
    const first = (user.first_name || user.name || '').trim();
    const last = (user.last_name || '').trim();
    const a = first[0]?.toUpperCase() || '';
    const b = last[0]?.toUpperCase() || (first.split(/\s+/)[1]?.[0] || '').toUpperCase();
    return (a + b) || '—';
}

function displayName(user) {
    if (!user) return '—';
    const parts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return parts || user.name || user.email || '—';
}

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <div
                        className="h-mono"
                        style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}
                    >
                        ACCOUNT · PROFILO
                    </div>
                    <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
                        Profilo.
                    </h1>
                </div>
            }
        >
            <Head title="Profilo · Holidays" />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr)',
                    gap: 18,
                    alignItems: 'start',
                }}
            >
                <section
                    className="h-card"
                    style={{ padding: 22, display: 'grid', gap: 14 }}
                >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <span className="h-avatar lg">{initialsOf(user)}</span>
                        <div style={{ minWidth: 0 }}>
                            <div className="h-display" style={{ fontSize: 22, wordBreak: 'break-word' }}>
                                {displayName(user)}
                            </div>
                            <div className="h-muted" style={{ fontSize: 12 }}>
                                {isAdmin ? 'Amministratore' : 'Dipendente'}
                                {user?.job_role ? ` · ${user.job_role}` : ''}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 14,
                            background: 'var(--h-bg-2)',
                            border: '2px dashed var(--h-line)',
                            borderRadius: 'var(--h-radius)',
                        }}
                    >
                        <div className="h-label" style={{ marginBottom: 6 }}>Email di lavoro</div>
                        <div className="h-mono" style={{ fontSize: 14, wordBreak: 'break-all' }}>
                            {user?.email || '—'}
                        </div>
                    </div>

                    <Button as="a" href={route('dashboard')} variant="ghost">
                        <Icon name="arrowL" size={14} />
                        Torna alla dashboard
                    </Button>
                </section>

                <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
                    <section className="h-card" style={{ padding: 22 }}>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </section>

                    <section className="h-card" style={{ padding: 22 }}>
                        <UpdatePasswordForm />
                    </section>

                    <section
                        className="h-card"
                        style={{ padding: 22, background: 'var(--h-rose)' }}
                    >
                        <DeleteUserForm />
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
