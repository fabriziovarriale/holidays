import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import Icon from '@/Components/h/Icon';

const POLL_MS = 60_000;

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`;
  return `${Math.floor(diff / 86400)}g fa`;
}

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export default function NotificationsBell({ compact = false, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const computeCoords = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const PANEL_W = 340;
    const margin = 12;
    let left;
    if (align === 'left') {
      left = r.left;
    } else {
      left = r.right - PANEL_W;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - PANEL_W - margin));
    setCoords({ top: r.bottom + 8, left });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await window.axios.get('/notifications');
      setItems(r.data.items || []);
      setUnread(r.data.unread_count || 0);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, POLL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      const insideBtn = ref.current && ref.current.contains(e.target);
      const insidePanel = panelRef.current && panelRef.current.contains(e.target);
      if (!insideBtn && !insidePanel) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => computeCoords();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  const handleOpen = () => {
    const next = !open;
    if (next) {
      computeCoords();
      fetchData();
    }
    setOpen(next);
  };

  const markRead = async (id) => {
    try {
      const r = await window.axios.post(`/notifications/${id}/read`, {}, {
        headers: { 'X-CSRF-TOKEN': csrfToken() },
      });
      setUnread(r.data.unread_count || 0);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const r = await window.axios.post('/notifications/read-all', {}, {
        headers: { 'X-CSRF-TOKEN': csrfToken() },
      });
      setUnread(r.data.unread_count || 0);
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    } catch {}
  };

  const onClickItem = async (n) => {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    if (n.data?.url) router.visit(n.data.url);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        aria-label="Notifiche"
        aria-expanded={open}
        className="h-btn h-btn-sm h-btn-ghost"
        style={{
          position: 'relative',
          padding: compact ? '6px 10px' : '8px 10px',
          height: compact ? 34 : 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="bell" size={compact ? 16 : 18} />
        {unread > 0 && (
          <span
            aria-label={`${unread} non lette`}
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: 'var(--h-coral)',
              color: 'var(--h-ink)',
              border: '1.5px solid var(--h-line)',
              fontSize: 10,
              fontWeight: 800,
              lineHeight: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && mounted && coords && createPortal(
        <div
          ref={panelRef}
          role="menu"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: 340,
            maxWidth: 'calc(100vw - 24px)',
            background: '#FFFFFF',
            border: 'var(--h-bw) solid var(--h-line)',
            borderRadius: 'var(--h-radius)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '2px solid var(--h-line)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Notifiche {unread > 0 && <span style={{ color: 'var(--h-muted)', fontWeight: 500 }}>· {unread} nuove</span>}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="h-btn h-btn-sm h-btn-ghost"
                style={{ padding: '4px 8px', fontSize: 11, height: 26 }}
              >
                Segna tutte lette
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading && items.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--h-muted)', fontSize: 12 }}>
                Caricamento…
              </div>
            )}

            {!loading && items.length === 0 && (
              <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--h-muted)', fontSize: 12 }}>
                Nessuna notifica
              </div>
            )}

            {items.map((n) => {
              const isUnread = !n.read_at;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onClickItem(n)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: isUnread ? '#FFF6E5' : '#FFFFFF',
                    borderBottom: '1px solid var(--h-line)',
                    cursor: 'pointer',
                    border: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 8,
                  }}>
                    <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: 13, lineHeight: 1.3 }}>
                      {n.data?.title || 'Notifica'}
                    </span>
                    {isUnread && (
                      <span style={{
                        width: 8, height: 8, borderRadius: 4,
                        background: 'var(--h-coral)',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                  {n.data?.message && (
                    <span style={{ fontSize: 12, color: 'var(--h-muted)', lineHeight: 1.35 }}>
                      {n.data.message}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--h-muted)', letterSpacing: '0.04em' }}>
                    {timeAgo(n.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
