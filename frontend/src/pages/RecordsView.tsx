import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

interface AttendanceRecord { id: string; rollNo: string; name: string; submittedAt: string; }
interface AbsentStudent { id: string; rollNo: string; name: string; }
interface SessionData {
  session: { id: string; status: string; startedAt: string; endedAt?: string; class: string };
  records: AttendanceRecord[];
  absentees: AbsentStudent[];
  totalStudents: number;
  presentCount: number;
}

export default function RecordsView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const _classId = searchParams.get('class');
  void _classId;

  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'present' | 'absent'>('present');

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/sessions/records/${sessionId}`)
      .then((res) => setData(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-canvas-soft)' }}>
      <div style={{ color: 'var(--c-ink-mute)', fontSize: '15px' }}>Loading…</div>
    </div>
  );

  if (!data) return null;

  const { session, records, absentees, totalStudents, presentCount } = data;
  const pct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const stats = [
    { label: 'Total', value: totalStudents, bg: 'var(--c-canvas-soft)', color: 'var(--c-ink)' },
    { label: 'Present', value: presentCount, bg: 'var(--c-success-bg)', color: 'var(--c-success)' },
    { label: 'Absent', value: totalStudents - presentCount, bg: 'var(--c-danger-bg)', color: 'var(--c-danger)' },
    { label: 'Attendance', value: `${pct}%`, bg: pct >= 75 ? 'var(--c-success-bg)' : 'var(--c-danger-bg)', color: pct >= 75 ? 'var(--c-success)' : 'var(--c-danger)' },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--c-canvas-soft)' }}>
      <nav className="sticky top-0 z-40 nav-stripe">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <button id="back-from-records" onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--c-hairline)' }} />
          <span style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>Session records</span>
          <span className="badge badge-ended">{session.class}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in">
          {stats.map((s) => (
            <div key={s.label} className="card" style={{ padding: '20px 24px', textAlign: 'center', background: s.bg, border: 'none' }}>
              <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: 300, color: s.color, letterSpacing: '-0.5px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10px', color: s.color, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '4px', opacity: 0.8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 fade-in">
          {/* Session Info */}
          <div className="card p-6">
            <h3 style={{ color: 'var(--c-ink)', fontSize: '14px', fontWeight: 400, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 }}>
              Session info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginBottom: '3px' }}>Date</div>
                <div style={{ color: 'var(--c-ink)', fontSize: '14px', fontWeight: 400 }}>
                  {new Date(session.startedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginBottom: '3px' }}>Time</div>
                <div className="tabular-nums" style={{ color: 'var(--c-ink)', fontSize: '14px', fontWeight: 400 }}>
                  {new Date(session.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {session.endedAt ? ` – ${new Date(session.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ' (Ongoing)'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginBottom: '3px' }}>Status</div>
                <span className={`badge badge-${session.status.toLowerCase()}`}>{session.status}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="md:col-span-2">
            <div className="card overflow-hidden">
              {/* Tab bar */}
              <div style={{
                display: 'flex', gap: '4px', padding: '8px',
                borderBottom: '1px solid var(--c-hairline)', background: 'var(--c-canvas-soft)',
              }}>
                {(['present', 'absent'] as const).map((t) => (
                  <button
                    key={t}
                    id={`tab-${t}`}
                    onClick={() => setTab(t)}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--r-pill)',
                      fontSize: '13px', fontWeight: 400, border: 'none', cursor: 'pointer',
                      background: tab === t ? 'var(--c-primary)' : 'transparent',
                      color: tab === t ? 'white' : 'var(--c-ink-mute)',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    {t === 'present' ? `Present (${presentCount})` : `Absent (${absentees.length})`}
                  </button>
                ))}
              </div>

              <table className="stripe-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    {tab === 'present' && <th style={{ textAlign: 'right' }}>Time</th>}
                  </tr>
                </thead>
                <tbody>
                  {tab === 'present' && records.map((rec, i) => (
                    <tr key={rec.id}>
                      <td className="tabular-nums" style={{ color: 'var(--c-ink-mute)', width: '48px' }}>{i + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--c-canvas-soft)', padding: '2px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-hairline)' }}>
                          {rec.rollNo}
                        </span>
                      </td>
                      <td style={{ color: 'var(--c-ink)', fontWeight: 400 }}>{rec.name}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--c-ink-mute)' }}>
                        {new Date(rec.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {tab === 'absent' && absentees.map((s, i) => (
                    <tr key={s.id}>
                      <td className="tabular-nums" style={{ color: 'var(--c-ink-mute)', width: '48px' }}>{i + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--c-canvas-soft)', padding: '2px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-hairline)' }}>
                          {s.rollNo}
                        </span>
                      </td>
                      <td style={{ color: 'var(--c-ink)', fontWeight: 400 }}>{s.name}</td>
                    </tr>
                  ))}
                  {tab === 'present' && records.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--c-ink-mute)' }}>
                        No students marked present.
                      </td>
                    </tr>
                  )}
                  {tab === 'absent' && absentees.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--c-ink-mute)' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
                        <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 300 }}>Perfect attendance!</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
