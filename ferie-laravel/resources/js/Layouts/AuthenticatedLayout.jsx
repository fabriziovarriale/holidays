import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';

function formatUserRole(user) {
    if (!user) return '';
    const appRole = user.role === 'admin' ? 'Amministratore' : 'Dipendente';
    return user.job_role ? `${appRole} · ${user.job_role}` : appRole;
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, impersonation } = usePage().props;
    const user = auth.user;
    const roleLine = formatUserRole(user);

    return (
        <div className="min-h-screen bg-background">
            {/* Top navbar */}
            <nav className="border-b border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Left: logo + desktop links */}
                        <div className="flex items-center gap-3">
                            {/* Logo */}
                            <Link href="/" className="flex shrink-0 items-center">
                                <ApplicationLogo className="block h-9 w-auto fill-current text-foreground" />
                            </Link>

                            {/* Desktop nav links */}
                            <div className="hidden space-x-8 lg:ms-6 lg:flex">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                    Dashboard
                                </NavLink>
                                {user?.role === 'admin' && (
                                    <>
                                        <NavLink href={route('admin.users.index')} active={route().current('admin.users.index')}>
                                            Utenti
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: quick actions (mobile) + user dropdown (desktop) */}
                        <div className="lg:hidden">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex max-w-[min(14rem,calc(100vw-9rem))] items-center gap-2 rounded-md py-1.5 pe-1 ps-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                                        aria-label="Menu utente"
                                    >
                                        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.5 7.5 0 0115 0" />
                                        </svg>
                                        <span className="min-w-0 truncate text-start text-sm leading-tight text-foreground">
                                            <span className="font-medium">{user?.name}</span>
                                            {roleLine ? (
                                                <>
                                                    <span className="text-muted-foreground"> · </span>
                                                    <span className="text-muted-foreground">{roleLine}</span>
                                                </>
                                            ) : null}
                                        </span>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    {impersonation?.active && (
                                        <Dropdown.Link href={route('impersonation.stop')} method="post" as="button">
                                            Torna admin
                                        </Dropdown.Link>
                                    )}
                                    <Dropdown.Link href={route('profile.edit')}>Profilo</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Esci
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        <div className="hidden lg:flex lg:items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex max-w-xs items-center gap-2 rounded-md border border-transparent bg-card px-3 py-2 text-sm font-medium leading-4 text-muted-foreground transition hover:text-foreground focus:outline-none sm:max-w-md"
                                        >
                                            <span className="min-w-0 truncate text-start text-foreground">
                                                <span className="font-medium">{user?.name}</span>
                                                {roleLine ? (
                                                    <>
                                                        <span className="text-muted-foreground"> · </span>
                                                        <span className="text-muted-foreground">{roleLine}</span>
                                                    </>
                                                ) : null}
                                            </span>
                                            <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    {impersonation?.active && (
                                        <Dropdown.Link href={route('impersonation.stop')} method="post" as="button">
                                            Torna admin
                                        </Dropdown.Link>
                                    )}
                                    <Dropdown.Link href={route('profile.edit')}>Profilo</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Esci
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-border bg-card shadow">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="pb-20 lg:pb-0">{children}</main>

            {/* Mobile bottom navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4">
                    <Link
                        href={route('dashboard')}
                        className={`flex min-w-20 flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                            route().current('dashboard')
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10.5L12 3l9 7.5M5.25 9.75V21h13.5V9.75" />
                        </svg>
                        <span>Dashboard</span>
                    </Link>

                    {user?.role === 'admin' && (
                        <Link
                            href={route('admin.users.index')}
                            className={`flex min-w-20 flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                route().current('admin.users.index')
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20h10M12 11a4 4 0 100-8 4 4 0 000 8zm0 0a7 7 0 00-7 7v2h14v-2a7 7 0 00-7-7z" />
                            </svg>
                            <span>Utenti</span>
                        </Link>
                    )}
                </div>
            </nav>
        </div>
    );
}
