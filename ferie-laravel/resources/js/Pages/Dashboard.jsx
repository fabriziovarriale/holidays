import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Icon from '@/Components/h/Icon';
import Button from '@/Components/h/Button';
import StatusBadge from '@/Components/h/StatusBadge';
import LeaveTypeTag from '@/Components/h/LeaveTypeTag';
import StatCard from '@/Components/h/StatCard';
import BalanceRing from '@/Components/h/BalanceRing';
import CreateRequestSlideover from '@/Components/CreateRequestSlideover';
import RequestDetailSlideover from '@/Components/RequestDetailSlideover';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ApprovedLeaveImpactCalendar from '@/Components/ApprovedLeaveImpactCalendar';

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
}) {
  const { errors = {}, flash = {}, auth } = usePage().props;
  const pageUser = auth?.user ?? user;
  const [createOpen, setCreateOpen] = useState(false);

  const hasLeaveErrors = ['leaveType', 'startDate', 'endDate', 'requestedUnits', 'note', 'userId']
    .some((k) => errors?.[k]);
  useEffect(() => { if (hasLeaveErrors) setCreateOpen(true); }, [hasLeaveErrors]);

  return (
    <AuthenticatedLayout
      header={
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="h-mono" style={{ fontSize: 11, color: 'var(--h-muted)', letterSpacing: '0.1em' }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
            <h1 className="h-display" style={{ fontSize: 44, marginTop: 4 }}>
              Ciao, {pageUser?.name?.split(' ')?.[0] || 'team'}.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && (
              <a
                href={route('admin.reports.export-leaves', { year: Number(year || new Date().getFullYear()) })}
                className="h-btn h-btn-sm"
              >
                <Icon name="download" size={16} /> Esporta CSV
              </a>
            )}
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={16} /> Nuova richiesta
            </Button>
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
          />
        : <EmployeeView
            balance={employeeBalance}
            requests={employeeRequests}
            holidays={companyHolidays}
          />}

      <div style={{ marginTop: 28 }}>
        <ApprovedLeaveImpactCalendar approvedEntries={approvedLeaveCalendar} holidays={companyHolidays} />
      </div>

      <CreateRequestSlideover
        show={createOpen}
        onClose={() => setCreateOpen(false)}
        leaveTypes={leaveTypes}
        employeeBalance={employeeBalance}
        employeeBalanceForLeaveStore={employeeBalanceForLeaveStore}
        leaveStoreYear={leaveStoreYear}
        employees={employees}
        employeesWithBalances={employeesWithBalances}
        isAdmin={isAdmin}
        errors={errors}
      />
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
    <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 1fr' }}>
      {/* Balance card */}
      <section className="h-card" style={{ padding: 22, background: 'var(--h-ink)', color: 'var(--h-bg)' }}>
        <div className="h-label" style={{ opacity: 0.7 }}>SALDO FERIE {new Date().getFullYear()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14 }}>
          <BalanceRing total={total} used={used} pending={pendingCnt} remaining={remaining} />
          <div style={{ display: 'grid', gap: 10, flex: 1 }}>
            <LegendRow dot="var(--h-coral)" label="Usati"    value={used} />
            <LegendRow dot="var(--h-yellow)" label="In attesa" value={pendingCnt} />
            <LegendRow dot="var(--h-mint)"  label="Residui"  value={remaining} />
            <div style={{ borderTop: '2px solid var(--h-bg)', paddingTop: 8, fontSize: 12, opacity: 0.8 }}>
              Totale maturato: <strong>{total}</strong> giorni
            </div>
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
                    {r.startDate} → {r.endDate}
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
              <div className="h-mono" style={{ fontSize: 13, fontWeight: 700 }}>{nextHoliday.date}</div>
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
          <div style={{ overflowX: 'auto' }}>
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
                    <td>{r.startDate} → {r.endDate}</td>
                    <td className="h-mono" style={{ fontSize: 13 }}>{r.createdAt || '—'}</td>
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

function LegendRow({ dot, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: dot }} />
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <strong className="h-mono" style={{ fontSize: 15 }}>{value}</strong>
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

function AdminView({ pendingRequests, approvedRequests, approvedMeta, rejectedRequests, rejectedMeta, employeesWithBalances }) {
  const [detail, setDetail] = useState(null);

  const employeesCount = Object.keys(employeesWithBalances || {}).length || 8;
  const today = new Date();
  const outToday = (pendingRequests.concat(approvedRequests))
    .filter((r) => r.status === 'APPROVED' &&
      new Date(r.startDate) <= today && new Date(r.endDate) >= today).length;

  const approved = approvedMeta?.total ?? approvedRequests.length;
  const rejected = rejectedMeta?.total ?? rejectedRequests.length;
  const totalDecided = approved + rejected;
  const approvalRate = totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 100;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* StatCards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="IN ATTESA"     value={pendingRequests.length} tone="yellow" />
        <StatCard label="OGGI IN UFFICIO" value={`${Math.max(0, employeesCount - outToday)}/${employeesCount}`} tone="mint" />
        <StatCard label="APPROVATE ANNO" value={approved} />
        <StatCard label="TASSO APPROVAZIONE" value={`${approvalRate}%`} tone="coral" />
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
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  gap: 14, padding: '14px 22px',
                  borderBottom: '2px solid var(--h-ink)',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <span className="h-avatar">{initialsOf(r.userFullName)}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong>{r.userFullName}</strong>
                    {r.jobRole && <span className="h-chip">{r.jobRole}</span>}
                    <LeaveTypeTag code={r.leaveType} />
                    {r.roleConflictWarning && (
                      <span className="h-chip" style={{ background: 'var(--h-rose)', borderColor: 'var(--h-line)' }}>
                        <Icon name="warning" size={12} /> Conflitto
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--h-muted)' }}>
                    {r.startDate} → {r.endDate} · {r.duration || `${r.days || '?'}g`}
                  </div>
                  {r.noteUser && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>"{r.noteUser}"</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Rifiutare la richiesta di ${r.userFullName}?`)) {
                      router.patch(route('admin.requests.reject', r.id), { note_admin: '' }, { preserveScroll: true });
                    }
                  }}
                  className="h-btn h-btn-sm"
                  style={{ background: 'var(--h-rose)' }}
                >
                  Rifiuta
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.patch(route('admin.requests.approve', r.id), {}, { preserveScroll: true });
                  }}
                  className="h-btn h-btn-sm h-btn-primary"
                >
                  Approva
                </button>
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
