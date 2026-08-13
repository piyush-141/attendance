import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from '../api/client';
import logoImg from '../assets/logo.png';

type State = 'loading' | 'form' | 'submitting' | 'success' | 'error';

interface SessionInfo { id: string; subject: string; class: string; }

export default function StudentScan() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [state, setState] = useState<State>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [challengeToken, setChallengeToken] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!qrToken) { setErrorMsg('Invalid QR code.'); setState('error'); return; }
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
        const res = await api.get(`/scan/${qrToken}`);
        setChallengeToken(res.data.challengeToken);
        setSession(res.data.session);
        setState('form');
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
        setErrorMsg(msg ?? 'This QR code has expired. Please scan the latest code displayed by your teacher.');
        setState('error');
      }
    };
    init();
  }, [qrToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim()) return;
    setState('submitting');
    try {
      await api.post('/attendance/submit', {
        challengeToken, rollNo: rollNo.trim().toUpperCase(),
        name: name.trim(), deviceFingerprint: fingerprint,
      });
      setSuccessMsg(`${name.trim()} · ${rollNo.trim().toUpperCase()}`);
      setState('success');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setErrorMsg(msg ?? 'Submission failed. Please try again.');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 mesh-bg">
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src={logoImg}
            alt="Attendance"
            style={{ height: '56px', width: 'auto', display: 'inline-block', marginBottom: '10px' }}
          />
          <div style={{ color: 'var(--c-ink)', fontSize: '18px', fontWeight: 300, letterSpacing: '-0.2px' }}>
            Attendance
          </div>
        </div>

        {/* Loading */}
        {state === 'loading' && (
          <div className="card p-10 text-center fade-in">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px' }}>Validating QR code…</p>
          </div>
        )}

        {/* Form */}
        {state === 'form' && session && (
          <div className="card p-7 fade-in">
            {/* Session badge */}
            <div style={{
              marginBottom: '20px', padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--c-canvas-soft)', border: '1px solid var(--c-hairline)',
              textAlign: 'center',
            }}>
              <div style={{ color: 'var(--c-ink)', fontSize: '14px', fontWeight: 400 }}>{session.subject}</div>
              <div style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginTop: '2px' }}>{session.class}</div>
            </div>

            <h2 style={{ color: 'var(--c-ink)', fontSize: '18px', fontWeight: 300, marginBottom: '20px', textAlign: 'center', letterSpacing: '-0.2px' }}>
              Mark your attendance
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label" htmlFor="roll-no">Roll number</label>
                <input id="roll-no" type="text" className="input"
                  placeholder="e.g. BT24CSE075"
                  value={rollNo} onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  required autoComplete="off" autoCapitalize="characters" />
              </div>
              <div>
                <label className="label" htmlFor="student-name">Full name</label>
                <input id="student-name" type="text" className="input"
                  placeholder="Your full name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  required autoComplete="name" />
              </div>
              <button id="submit-attendance-btn" type="submit"
                className="btn btn-primary w-full justify-center"
                style={{ marginTop: '6px', fontSize: '15px', padding: '10px 16px' }}>
                Submit attendance →
              </button>
            </form>

            <p style={{ color: 'var(--c-ink-mute)', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
              Your device is uniquely linked to prevent duplicate submissions.
            </p>
          </div>
        )}

        {/* Submitting */}
        {state === 'submitting' && (
          <div className="card p-10 text-center fade-in">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>🚀</div>
            <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px' }}>Recording attendance…</p>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="card p-10 text-center fade-in" style={{ borderColor: 'var(--c-success)', borderWidth: '1px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: 'var(--c-ink)', fontSize: '18px', fontWeight: 300, marginBottom: '8px', letterSpacing: '-0.2px' }}>
              You're all set!
            </h2>
            <p className="tabular-nums" style={{ color: 'var(--c-ink-mute)', fontSize: '14px' }}>
              {successMsg}
            </p>
            <div style={{
              marginTop: '20px', padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--c-success-bg)', color: 'var(--c-success)', fontSize: '13px',
            }}>
              Attendance recorded ✓
            </div>
            <p style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginTop: '16px' }}>
              You may close this tab.
            </p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="card p-10 text-center fade-in" style={{ borderColor: 'var(--c-danger)', borderWidth: '1px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
            <h2 style={{ color: 'var(--c-ink)', fontSize: '18px', fontWeight: 300, marginBottom: '8px', letterSpacing: '-0.2px' }}>
              Unable to submit
            </h2>
            <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px' }}>{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
