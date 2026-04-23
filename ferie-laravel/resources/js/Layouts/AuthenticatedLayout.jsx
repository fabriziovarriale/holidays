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

// Mobile bottom nav: keep the most-used pages only (cap at 5 tab slots).
// Admin loses "Report" on mobile — still reachable from desktop sidebar.
const MOBILE_NAV_ADMIN = NAV_ADMIN.filter((n) => n.key !== 'admin.reports.index');
const MOBILE_NAV_USER = NAV_USER;

function formatRole(user) {
  if (!user) return '';
  const base = user.role === 'admin' ? 'Amministratore' : 'Dipendente';
  return user.job_role ? `${base} · ${user.job_role}` : base;
}

export default function AuthenticatedLayout({ header, children }) {
  const { auth, impersonation } = usePage().props;
  const user = auth?.user;
  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_USER;
  const mobileNav = user?.role === 'admin' ? MOBILE_NAV_ADMIN : MOBILE_NAV_USER;

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
    <div
      className="h-root h-app-shell"
      style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}
    >
      {/* SIDEBAR — desktop only */}
      <aside
        className="h-sidebar-desktop"
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
        {/* Mobile top bar — logo + impersonation + logout */}
        <header
          className="h-mobile-only"
          style={{
            borderBottom: 'var(--h-bw) solid var(--h-line)',
            background: 'var(--h-surface)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'nowrap',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
              flex: '0 1 auto',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'var(--h-coral)',
              border: '2px solid var(--h-line)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--h-display)', fontSize: 16, color: 'var(--h-ink)',
              flexShrink: 0,
            }}>U</div>
            <div
              className="h-display"
              style={{
                fontSize: 15,
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Holidays
            </div>
          </Link>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {impersonation?.active && (
              <Link
                href={route('impersonation.stop')}
                method="post"
                as="button"
                className="h-btn h-btn-sm"
                aria-label="Torna admin"
                style={{ background: 'var(--h-yellow)', padding: 8 }}
              >
                <Icon name="arrowL" size={14} />
              </Link>
            )}
            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="h-btn h-btn-sm h-btn-ghost"
              aria-label="Esci"
              style={{ padding: 8, flexShrink: 0 }}
            >
              <Icon name="logout" size={16} />
            </Link>
          </div>
        </header>

        {header && (
          <header
            className="h-main-header"
            style={{
              borderBottom: 'var(--h-bw) solid var(--h-line)',
              background: 'var(--h-bg)',
              padding: '22px 28px',
            }}
          >
            {header}
          </header>
        )}
        <main className="h-main" style={{ padding: 28, background: 'var(--h-bg)', flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="h-mobile-nav" aria-label="Navigazione principale">
        {mobileNav.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <Link
              key={item.key}
              href={route(item.routeName)}
              className={`h-mobile-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
