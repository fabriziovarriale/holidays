import { Head, usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Icon from '@/Components/h/Icon';
import StatusBadge from '@/Components/h/StatusBadge';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import BalanceRing from '@/Components/h/BalanceRing';
import RequestDetailSlideover from '@/Components/RequestDetailSlideover';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ApprovedLeaveImpactCalendar from '@/Components/ApprovedLeaveImpactCalendar';
import { fmtDate, fmtDateTime } from '@/lib/date';

export default function Dashboard({
  user,
  year,
  leaveTypes,
  employeeBalance,
  employeeBalanceForLeaveStore = null,
  leaveStoreYear = new Date().getFullYear(),
  employeeRequests = [],
  employees = [],
  employeesWithBalances = {},
  approvedLeaveCalendar = [],
  companyHolidays = [],
  isAdmin = false,
  pendingRequests = [],
  approvedRequests = [],
  approvedMeta = null,
  rejectedRequests = [],
  rejectedMeta = null,
  todayOff = [],
}) {
  const { flash = {}, auth } = usePage().props;
  const pageUser = auth?.user ?? user;

  return (
    <AuthenticatedLayout
      header={
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="h-mono" style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
            <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
              Ciao, {isAdmin
                ? 'team'
                : (pageUser?.first_name || pageUser?.name?.split(' ')?.[0] || 'dipendente')}.
            </h1>
          </div>
        </div>
      }
    >
      <Head title="Dashboard · Holidays" />

      {flash?.status && (
        <div className="h-card" style={{ padding: 14, marginBottom: 18, background: 'var(--h-mint)' }}>
          <strong>✓</strong> {flash.status}
        </div>
      )}

      {isAdmin
        ? <AdminView
            pendingRequests={pendingRequests}
            approvedRequests={approvedRequests}
            approvedMeta={approvedMeta}
            rejectedRequests={rejectedRequests}
            rejectedMeta={rejectedMeta}
            employeesWithBalances={employeesWithBalances}
            todayOff={todayOff}
          />
        : <EmployeeView
            balance={employeeBalance}
            requests={employeeRequests}
            holidays={companyHolidays}
          />}

      <div style={{ marginTop: 28 }}>
        <ApprovedLeaveImpactCalendar approvedEntries={approvedLeaveCalendar} holidays={companyHolidays} />
      </div>

    </AuthenticatedLayout>
  );
}

/* —————————————————————————————————————————————— EMPLOYEE VIEW */

function EmployeeView({ balance, requests, holidays }) {
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [cancelProcessing, setCancelProcessing] = useState(false);
  const [detail, setDetail] = useState(null);

  const total      = balance?.total ?? 0;
  const used       = balance?.used ?? 0;
  const pendingCnt = balance?.pending ?? 0;
  const remaining  = balance?.remaining ?? (total - used - pendingCnt);

  const upcoming = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED' && new Date(r.startDate) >= new Date()).slice(0, 3),
    [requests]
  );
  const nextHoliday = (holidays || []).find((h) => new Date(h.date) >= new Date());

  const handleCancel = () => {
    if (!pendingCancelId) return;
    setCancelProcessing(true);
    router.patch(route('leave-request.cancel', pendingCancelId), {}, {
      preserveScroll: true,
      onFinish: () => { setCancelProcessing(false); setPendingCancelId(null); },
    });
  };

  return (
    <div className="h-grid-responsive" style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 1fr' }}>
      {/* Balance card */}
      <section className="h-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="h-label">SALDO FERIE {new Date().getFullYear()}</div>
          <div className="h-mono h-muted" style={{ fontSize: 11 }}>
            maturati <b style={{ color: 'var(--h-ink)' }}>{total}</b>g
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14 }}>
          <BalanceRing total={total} used={used} pending={pendingCnt} remaining={remaining} />
          <div style={{ display: 'grid', gap: 10, flex: 1 }}>
            <LegendRow dot="var(--h-coral)"  label="Usati"     value={used} />
            <LegendRow dot="var(--h-yellow)" label="In attesa" value={pendingCnt} />
            <LegendRow dot="var(--h-mint)"   label="Residui"   value={remaining} strong />
          </div>
        </div>
      </section>

      {/* Upcoming + next holiday */}
      <section style={{ display: 'grid', gap: 18 }}>
        <div className="h-card" style={{ padding: 18 }}>
          <div className="h-label">PROSSIME ASSENZE APPROVATE</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--h-muted)', fontSize: 13 }}>Nessuna assenza pianificata.</div>
            ) : upcoming.map((r) => (
              <button
                key={r.id}
                onClick={() => setDetail(r)}
                className="h-card-flat"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 10,
                  border: '2px solid var(--h-line)',
                  borderRadius: 'var(--h-radius)',
                  background: 'var(--h-surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <DateChip date={r.startDate} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LeaveTypeTag code={r.leaveType} />
                  </div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>
                    {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                  </div>
                </div>
                <Icon name="chevR" size={16} />
              </button>
            ))}
          </div>
        </div>

        {nextHoliday && (
          <div className="h-card" style={{ padding: 14, background: 'var(--h-yellow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="sparkle" size={20} />
              <div style={{ flex: 1 }}>
                <div className="h-label">PROSSIMA FESTIVITÀ</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{nextHoliday.name}</div>
              </div>
              <div className="h-mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(nextHoliday.date)}</div>
            </div>
          </div>
        )}
      </section>

      {/* Storico richieste */}
      <section className="h-card" style={{ padding: 0, gridColumn: '1 / -1' }}>
        <div style={{ padding: '18px 22px', borderBottom: 'var(--h-bw) solid var(--h-line)' }}>
          <h3 className="h-heading" style={{ fontSize: 20 }}>Storico richieste</h3>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>Nessuna richiesta</div>
        ) : (
          <>
            {/* Desktop: tabella densa */}
            <div className="h-desktop-only" style={{ overflowX: 'auto' }}>
              <table className="h-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Periodo</th>
                    <th>Inviata</th>
                    <th>Stato</th>
                    <th>Note admin</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} onClick={() => setDetail(r)} style={{ cursor: 'pointer' }}>
                      <td><LeaveTypeTag code={r.leaveType} /></td>
                      <td>{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</td>
                      <td className="h-mono" style={{ fontSize: 13 }}>{fmtDateTime(r.createdAt)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ fontSize: 13, color: 'var(--h-muted)', fontStyle: r.noteAdmin ? 'italic' : 'normal' }}>
                        {r.noteAdmin || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPendingCancelId(r.id); }}
                            className="h-btn h-btn-sm h-btn-ghost"
                            style={{ color: 'var(--h-err)' }}
                          >
                            Annulla
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card stack senza scroll orizzontale */}
            <div className="h-mobile-only" style={{ flexDirection: 'column' }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setDetail(r)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    padding: '14px 18px',
                    borderBottom: '2px solid var(--h-ink)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <LeaveTypeTag code={r.leaveType} />
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="h-mono" style={{ fontSize: 12, color: 'var(--h-muted)', marginTop: 6 }}>
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    </div>
                    {r.noteAdmin && (
                      <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--h-muted)', marginTop: 6, wordBreak: 'break-word' }}>
                        "{r.noteAdmin}"
                      </div>
                    )}
                    {r.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPendingCancelId(r.id); }}
                        className="h-btn h-btn-sm h-btn-ghost"
                        style={{ color: 'var(--h-err)', marginTop: 8, padding: '4px 10px' }}
                      >
                        Annulla richiesta
                      </button>
                    )}
                  </div>
                  <Icon name="chevR" size={16} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        show={pendingCancelId !== null}
        title="Annulla richiesta"
        message="Annullare questa richiesta? L'operazione non può essere disfatta."
        confirmLabel="Sì, annulla"
        cancelLabel="Indietro"
        destructive
        processing={cancelProcessing}
        onConfirm={handleCancel}
        onCancel={() => setPendingCancelId(null)}
      />
      <RequestDetailSlideover
        request={detail}
        show={detail !== null}
        onClose={() => setDetail(null)}
        variant="employee"
      />
    </div>
  );
}

function LegendRow({ dot, label, value, strong = false }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 6,
        borderBottom: '2px dashed var(--h-line)',
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          background: dot,
          border: '2px solid var(--h-line)',
        }}
      />
      <span style={{ flex: 1, fontSize: 13, fontWeight: strong ? 700 : 500 }}>{label}</span>
      <strong
        className="h-mono"
        style={{
          fontSize: strong ? 20 : 16,
          color: strong ? 'var(--h-coral)' : 'var(--h-ink)',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function DateChip({ date }) {
  const d = new Date(date);
  const day = d.getDate();
  const mon = d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  return (
    <div style={{
      minWidth: 54, border: '2px solid var(--h-line)', borderRadius: 'var(--h-radius)',
      background: 'var(--h-coral)', color: 'var(--h-ink)', padding: '4px 8px',
      textAlign: 'center',
    }}>
      <div className="h-mono" style={{ fontSize: 10 }}>{mon}</div>
      <div className="h-display" style={{ fontSize: 22, lineHeight: 1 }}>{day}</div>
    </div>
  );
}

/* —————————————————————————————————————————————— ADMIN VIEW */

function AdminView({ pendingRequests, approvedRequests, approvedMeta, rejectedRequests, rejectedMeta, employeesWithBalances, todayOff = [] }) {
  const [detail, setDetail] = useState(null);

  const someoneOut = todayOff.length > 0;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Oggi fuori ufficio — banner evidenziato */}
      <section
        className="h-card"
        style={{
          padding: 22,
          background: someoneOut ? 'var(--h-yellow)' : 'var(--h-mint)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: someoneOut ? 14 : 0, gap: 10, flexWrap: 'wrap' }}>
          <h3 className="h-heading" style={{ fontSize: 18 }}>
            {someoneOut ? 'Oggi fuori ufficio' : 'Oggi tutti in ufficio'}
          </h3>
          {someoneOut && (
            <div className="h-mono" style={{ fontSize: 11 }}>
              {todayOff.length} {todayOff.length === 1 ? 'persona' : 'persone'}
            </div>
          )}
        </div>

        {someoneOut && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {todayOff.map((r) => {
              const parts = (r.userFullName || '').split(' ');
              const initials = `${(parts[0]?.[0] || '').toUpperCase()}${(parts[1]?.[0] || '').toUpperCase()}` || '—';
              return (
                <div
                  key={r.id}
                  style={{
                    border: 'var(--h-bw) solid var(--h-line)',
                    borderRadius: 'var(--h-radius)',
                    padding: 12,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    background: 'var(--h-surface)',
                  }}
                >
                  <span className="h-avatar">{initials}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.userFullName}
                    </div>
                    <div className="h-muted" style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <LeaveTypeTag code={r.leaveType} />
                      <span>· rientra {fmtDate(r.returnsOn)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending queue */}
      <section className="h-card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px', borderBottom: 'var(--h-bw) solid var(--h-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="h-heading" style={{ fontSize: 20 }}>Coda approvazioni</h3>
            <div style={{ fontSize: 13, color: 'var(--h-muted)' }}>
              {pendingRequests.length} richieste in attesa
            </div>
          </div>
        </div>
        {pendingRequests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--h-muted)' }}>
            Nessuna richiesta in attesa. ✓
          </div>
        ) : (
          <div style={{ display: 'grid' }}>
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                onClick={() => setDetail(r)}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: '2px solid var(--h-ink)',
                  cursor: 'pointer',
                }}
              >
                <span className="h-avatar" style={{ flexShrink: 0 }}>
                  {initialsOf(r.userFullName)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>
                    {r.userFullName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {r.jobRole && <span className="h-chip">{r.jobRole}</span>}
                    <LeaveTypeTag code={r.leaveType} />
                    {r.roleConflictWarning && (
                      <span className="h-chip" style={{ background: 'var(--h-rose)', borderColor: 'var(--h-line)' }}>
                        <Icon name="warning" size={12} /> Conflitto
                      </span>
                    )}
                  </div>
                  <div className="h-mono" style={{ fontSize: 12, color: 'var(--h-muted)' }}>
                    {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    {' · '}
                    {r.requestedUnits}
                    {r.leaveType === 'PERMESSO' ? 'h' : 'g'}
                  </div>
                  {r.noteUser && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4, color: 'var(--h-muted)' }}>
                      "{r.noteUser}"
                    </div>
                  )}
                </div>
                <Icon name="chevR" size={16} />
              </div>
            ))}
          </div>
        )}
      </section>

      <RequestDetailSlideover
        request={detail}
        show={detail !== null}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function initialsOf(fullName) {
  if (!fullName) return '—';
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}
