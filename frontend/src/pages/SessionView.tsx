import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';

interface AttendanceRecord {
  rollNo: string;
  name: string;
  submittedAt: string;
  isNew?: boolean;
}

interface QrState {
  dataUrl: string;
  token: string;
  ttlMs: number;
}

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    session?: { id: string; startedAt: string };
    qr?: QrState;
    subjectCode?: string;
    className?: string;
    colorIndex?: number;
  } | null;

  const [qr, setQr] = useState<QrState | null>(locationState?.qr ?? null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [ending, setEnding] = useState(false);
  const [qrProgress, setQrProgress] = useState(100);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subjectCode = locationState?.subjectCode ?? '—';
  const className = locationState?.className ?? '—';

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/sessions/records/${sessionId}`)
      .then((res) => {
        setRecords(res.data.records || []);
        setTotalStudents(res.data.totalStudents || 0);
        if (res.data.session?.status !== 'ACTIVE') setSessionEnded(true);
      })
      .catch(() => {});
  }, [sessionId]);

  const fetchQr = useCallback(async () => {
    if (!sessionId || sessionEnded) return;
    try {
      const res = await api.get(`/sessions/${sessionId}/qr`);
      setQr(res.data.qr);
      setQrProgress(100);
    } catch {}
  }, [sessionId, sessionEnded]);

  useEffect(() => {
    if (!sessionId || sessionEnded) return;
    qrIntervalRef.current = setInterval(fetchQr, 8500);
    return () => { if (qrIntervalRef.current) clearInterval(qrIntervalRef.current); };
  }, [fetchQr, sessionId, sessionEnded]);

  useEffect(() => {
    if (!qr || sessionEnded) return;
    const startTime = Date.now();
    const totalMs = qr.ttlMs > 0 ? qr.ttlMs : 9000;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / totalMs) * 100);
      setQrProgress(pct);
      if (pct === 0 && progressRef.current) clearInterval(progressRef.current);
    }, 100);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [qr, sessionEnded]);

  const handleNewRecord = useCallback((record: { rollNo: string; name: string; submittedAt: string }) => {
    setRecords((prev) => [{ ...record, isNew: true }, ...prev]);
    setTimeout(() => {
      setRecords((prev) => prev.map((r) => r.rollNo === record.rollNo ? { ...r, isNew: false } : r));
    }, 2000);
  }, []);

  const handleSessionEnded = useCallback(() => {
    setSessionEnded(true);
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
  }, []);

  useSocket(sessionId ?? null, handleNewRecord, handleSessionEnded);

  const endSession = async () => {
    if (!sessionId || ending) return;
    if (!confirm('End the attendance session? Students will no longer be able to submit.')) return;
    setEnding(true);
    try {
      await api.post(`/sessions/${sessionId}/end`);
      setSessionEnded(true);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to end session';
      alert(msg);
    } finally {
      setEnding(false);
    }
  };

  const absent = Math.max(0, totalStudents - records.length);

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--c-canvas-soft)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 nav-stripe">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button id="back-to-dashboard" onClick={() => navigate('/dashboard')} className="btn btn-ghost"
              style={{ padding: '6px 10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--c-hairline)' }} />
            <span style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>{subjectCode}</span>
            <span className="badge badge-ended">{className}</span>
          </div>

          <div className="flex items-center gap-3">
            {!sessionEnded && (
              <div className="flex items-center gap-2" style={{
                fontSize: '13px', color: 'var(--c-success)', fontWeight: 400,
                background: 'var(--c-success-bg)', padding: '4px 10px', borderRadius: 'var(--r-pill)',
              }}>
                <div className="pulse-dot" />
                Live
              </div>
            )}
            {!sessionEnded ? (
              <button
                id="end-session-btn"
                onClick={endSession}
                disabled={ending}
                className="btn"
                style={{
                  background: 'var(--c-danger)', color: 'white', fontSize: '13px',
                  padding: '7px 14px', boxShadow: 'none',
                }}
              >
                {ending ? 'Ending…' : 'End session'}
              </button>
            ) : (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary"
                style={{ fontSize: '13px', padding: '7px 14px' }}>
                Done
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {sessionEnded && (
          <div className="mb-6 p-4 rounded-lg text-center fade-in"
            style={{ background: 'var(--c-canvas)', border: '1px solid var(--c-hairline)', color: 'var(--c-ink)', fontSize: '14px' }}>
            Session ended · <strong className="tabular-nums">{records.length}</strong> student{records.length !== 1 ? 's' : ''} marked present
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* QR Panel */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-20" style={{ background: 'var(--c-canvas)' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>Scan to attend</div>
                  <div style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '2px' }}>
                    QR refreshes every 9s
                  </div>
                </div>
                {!sessionEnded && (
                  <span style={{
                    background: 'var(--c-success-bg)', color: 'var(--c-success)',
                    fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--r-pill)',
                  }}>
                    Rotating
                  </span>
                )}
              </div>

              {sessionEnded ? (
                <div style={{
                  aspectRatio: '1', borderRadius: 'var(--r-md)', background: 'var(--c-canvas-soft)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  border: '1px solid var(--c-hairline)',
                }}>
                  <div style={{ fontSize: '32px', opacity: 0.4 }}>🔒</div>
                  <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px' }}>Session closed</p>
                </div>
              ) : qr?.dataUrl ? (
                <div>
                  <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--c-hairline)', padding: '10px', background: 'white', position: 'relative' }}>
                    <img src={qr.dataUrl} alt="Attendance QR" style={{ width: '100%', aspectRatio: '1', display: 'block', borderRadius: '4px' }} />
                    <a
                      href={`/scan/${qr.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open student view in new tab"
                      style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.8)', opacity: 0, transition: 'opacity 0.2s',
                        color: 'var(--c-primary)', fontWeight: 500, fontSize: '14px', textDecoration: 'none'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      Open student view ↗
                    </a>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--c-ink-mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Refreshing in</span>
                      <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--c-ink)', fontWeight: 400 }}>
                        {Math.ceil((qrProgress / 100) * 9)}s
                      </span>
                    </div>
                    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--c-hairline)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', background: 'var(--c-primary)', borderRadius: '2px',
                        width: `${qrProgress}%`, transition: 'width 0.1s linear',
                      }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ aspectRatio: '1', borderRadius: 'var(--r-md)', background: 'var(--c-canvas-soft)', animation: 'pulse 2s infinite' }} />
              )}
            </div>
          </div>

          {/* Attendance Log */}
          <div className="lg:col-span-3">
            <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--c-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>Attendance log</div>
                  <div style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '2px' }}>Live updates</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--c-success-bg)', borderRadius: 'var(--r-md)' }}>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 300, color: 'var(--c-success)' }}>{records.length}</div>
                    <div style={{ fontSize: '10px', color: 'var(--c-success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Present</div>
                  </div>
                  {totalStudents > 0 && (
                    <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--c-danger-bg)', borderRadius: 'var(--r-md)' }}>
                      <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 300, color: 'var(--c-danger)' }}>{absent}</div>
                      <div style={{ fontSize: '10px', color: 'var(--c-danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Absent</div>
                    </div>
                  )}
                </div>
              </div>

              {records.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>📱</div>
                  <p style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 300 }}>Waiting for students</p>
                  <p style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '6px' }}>The list populates as students scan the QR code.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table className="stripe-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th style={{ textAlign: 'right' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, i) => (
                        <tr key={rec.rollNo} className={rec.isNew ? 'row-new' : ''}>
                          <td className="tabular-nums" style={{ color: 'var(--c-ink-mute)', width: '48px' }}>{records.length - i}</td>
                          <td>
                            <span style={{
                              background: 'var(--c-canvas-soft)', color: 'var(--c-ink)',
                              padding: '2px 8px', borderRadius: 'var(--r-sm)',
                              fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--c-hairline)',
                            }}>
                              {rec.rollNo}
                            </span>
                          </td>
                          <td style={{ color: 'var(--c-ink)', fontWeight: 400 }}>{rec.name}</td>
                          <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--c-ink-mute)' }}>
                            {new Date(rec.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
