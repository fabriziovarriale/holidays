import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateUserSlideover from '@/Components/CreateUserSlideover';
import UserDetailSlideover from '@/Components/UserDetailSlideover';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const CREATE_USER_ERROR_KEYS = ['firstName', 'lastName', 'email', 'password', 'password_confirmation', 'jobRole'];

export default function Users({ users, year }) {
    const { flash = {}, errors = {} } = usePage().props;
    const hasCreateErrors = CREATE_USER_ERROR_KEYS.some((k) => errors?.[k]);
    const [createSlideoverOpen, setCreateSlideoverOpen] = useState(hasCreateErrors);
    const [selectedUser, setSelectedUser] = useState(null);
    const status = flash?.status;

    useEffect(() => {
        if (hasCreateErrors) setCreateSlideoverOpen(true);
    }, [hasCreateErrors]);

    useEffect(() => {
        if (status === 'Utente creato.') setCreateSlideoverOpen(false);
    }, [status]);

    // Auto-apre lo slideover dell'utente se passato come query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openUserId = params.get('openUser');
        if (openUserId) {
            const user = users.find((u) => String(u.id) === openUserId);
            if (user) setSelectedUser(user);
        }
    }, [users]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Utenti
                    </h2>
                    <button
                        type="button"
                        onClick={() => setCreateSlideoverOpen(true)}
                        className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        Aggiungi utente
                    </button>
                </div>
            }
        >
            <Head title="Utenti" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-lg bg-card border border-border p-6 shadow">
                        {status && (
                            <p className="mb-4 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                                {status}
                            </p>
                        )}
                        <p className="mb-4 text-sm text-muted-foreground">
                            Clicca su una riga per vedere i dettagli e modificare il budget ferie per l&apos;anno {year}.
                        </p>
                        {users.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">Nessun dipendente</p>
                        ) : (
                            <>
                                {/* Card layout — mobile */}
                                <ul className="space-y-3 sm:hidden">
                                    {users.map((u) => (
                                        <li
                                            key={u.id}
                                            onClick={() => setSelectedUser(u)}
                                            className="cursor-pointer rounded-lg border border-border p-4 hover:bg-accent/50"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                                </div>
                                                {u.jobRole && (
                                                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                                        {u.jobRole}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="rounded bg-muted/50 px-2 py-1">
                                                    <p className="text-muted-foreground">Budget</p>
                                                    <p className="font-semibold text-foreground">{u.allocatedDays}</p>
                                                </div>
                                                <div className="rounded bg-amber-500/10 px-2 py-1">
                                                    <p className="text-muted-foreground">Usati</p>
                                                    <p className="font-semibold text-foreground">{u.usedDays}</p>
                                                </div>
                                                <div className="rounded bg-emerald-500/10 px-2 py-1">
                                                    <p className="text-muted-foreground">Residui</p>
                                                    <p className="font-semibold text-foreground">{u.remaining}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Table layout — desktop */}
                                <div className="hidden overflow-x-auto sm:block">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Nome</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Ruolo</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Budget {year}</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Usati</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Residui</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {users.map((u) => (
                                                <tr
                                                    key={u.id}
                                                    onClick={() => setSelectedUser(u)}
                                                    className="cursor-pointer transition-colors hover:bg-accent/50"
                                                >
                                                    <td className="px-4 py-2 text-foreground">
                                                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                                                    </td>
                                                    <td className="px-4 py-2 text-foreground">{u.email}</td>
                                                    <td className="px-4 py-2 text-foreground">{u.jobRole || '—'}</td>
                                                    <td className="px-4 py-2 font-medium text-foreground">{u.allocatedDays}</td>
                                                    <td className="px-4 py-2 text-foreground">{u.usedDays}</td>
                                                    <td className="px-4 py-2 text-foreground">{u.remaining}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <CreateUserSlideover
                show={createSlideoverOpen}
                onClose={() => setCreateSlideoverOpen(false)}
            />

            <UserDetailSlideover
                user={selectedUser}
                year={year}
                onClose={() => setSelectedUser(null)}
            />
        </AuthenticatedLayout>
    );
}
