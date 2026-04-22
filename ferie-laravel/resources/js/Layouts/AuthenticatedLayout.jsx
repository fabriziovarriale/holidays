import { Link, usePage, router } from '@inertiajs/react';
import Icon from '@/Components/h/Icon';

const NAV_USER = [
  { key: 'dashboard',      label: 'Dashboard',  icon: 'home', routeName: 'dashboard' },
  { key: 'requests.index', label: 'Richieste',  icon: 'doc',  routeName: 'requests.index' },
  { key: 'profile.edit',   label: 'Profilo',    icon: 'user', routeName: 'profile.edit' },
];

const NAV_ADMIN = [
  { key: 'dashboard',           label: 'Dashboard',  icon: 'home',   routeName: 'dashboard' },
  { key: 'requests.index',      label: 'Richieste',  icon: 'doc',    routeName: 'requests.index' },
  { key: 'team.index',          label: 'Team',       icon: 'team',   routeName: 'team.index' },
  { key: 'admin.users.index',   label: 'Utenti',     icon: 'users',  routeName: 'admin.users.index' },
  { key: 'admin.reports.index', label: 'Report',     icon: 'report', routeName: 'admin.reports.index' },
  { key: 'profile.edit',        label: 'Profilo',    icon: 'user',   routeName: 'profile.edit' },
];

function formatRole(user) {
  if (!user) return '';
  const base = user.role === 'admin' ? 'Amministratore' : 'Dipendente';
  return user.job_role ? `${base} · ${user.job_role}` : base;
}

export default function AuthenticatedLayout({ header, children }) {
  const { auth, impersonation } = usePage().props;
  const user = auth?.user;
  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_USER;

  const activeKey = (() => {
    try {
      return nav.find((n) => route().current(n.routeName))?.key;
    } catch {
      return null;
    }
  })();

  const initials = user
    ? `${(user.first_name?.[0] || user.name?.[0] || '')}${(user.last_name?.[0] || user.name?.split(' ')?.[1]?.[0] || '')}`.toUpperCase()
    : '—';

  return (
    <div className="h-root" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          borderRight: 'var(--h-bw) solid var(--h-line)',
          background: 'var(--h-surface)',
          padding: '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--h-coral)',
            border: 'var(--h-bw) solid var(--h-line)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--h-display)', fontSize: 22, color: 'var(--h-ink)',
          }}>U</div>
          <div>
            <div className="h-display" style={{ fontSize: 18, lineHeight: 1 }}>Holidays</div>
            <div className="h-mono" style={{ fontSize: 10, color: 'var(--h-muted)', letterSpacing: '0.1em' }}>BITBOSS</div>
          </div>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {nav.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={route(item.routeName)}
                className="h-btn h-btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  background: isActive ? 'var(--h-ink)' : 'transparent',
                  color: isActive ? 'var(--h-bg)' : 'var(--h-ink)',
                  boxShadow: isActive ? 'var(--h-shadow-sm)' : 'none',
                  border: isActive ? 'var(--h-bw) solid var(--h-line)' : '2px solid transparent',
                  padding: '10px 12px',
                  textDecoration: 'none',
                }}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {impersonation?.active && (
            <Link
              href={route('impersonation.stop')}
              method="post"
              as="button"
              className="h-btn h-btn-sm"
              style={{ width: '100%', background: 'var(--h-yellow)' }}
            >
              Torna admin
            </Link>
          )}

          <div
            className="h-card-flat"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              border: '2px solid var(--h-line)',
              borderRadius: 'var(--h-radius)',
            }}
          >
            <span className="h-avatar" style={{ background: 'var(--h-mint)' }}>{initials}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--h-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatRole(user)}
              </div>
            </div>
          </div>

          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="h-btn h-btn-sm h-btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Icon name="logout" size={16} />
            <span>Esci</span>
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header && (
          <header
            style={{
              borderBottom: 'var(--h-bw) solid var(--h-line)',
              background: 'var(--h-bg)',
              padding: '22px 28px',
            }}
          >
            {header}
          </header>
        )}
        <main style={{ padding: 28, background: 'var(--h-bg)', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
