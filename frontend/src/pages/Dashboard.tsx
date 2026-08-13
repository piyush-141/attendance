import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logoImg from '../assets/logo.png';

interface ClassGroup { id: string; name: string; }
interface Subject { id: string; code: string; name: string; classes: ClassGroup[]; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<{ name: string; email: string } | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [addingClassToSubject, setAddingClassToSubject] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, subjectsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/subjects'),
        ]);
        setTeacher(meRes.data.teacher);
        setSubjects(subjectsRes.data.subjects);
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const toggleSubject = (id: string) => {
    setExpandedSubject(expandedSubject === id ? null : id);
    setAddingClassToSubject(null);
  };

  const startAttendance = async (subjectId: string, classId: string, subjectCode: string, className: string, colorIndex: number) => {
    setStartingSession(classId);
    try {
      const res = await api.post('/sessions/start', { subjectId, classId });
      navigate(`/session/${res.data.session.id}`, {
        state: { session: res.data.session, qr: res.data.qr, subjectCode, className, colorIndex },
      });
    } catch (err: unknown) {
      const errData = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string; sessionId?: string } } }).response?.data
        : undefined;
      if (errData?.sessionId) {
        navigate(`/session/${errData.sessionId}`, { state: { subjectCode, className, colorIndex } });
      } else {
        alert(errData?.error ?? 'Failed to start session');
      }
    } finally {
      setStartingSession(null);
    }
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode || !newSubName) return;
    try {
      const res = await api.post('/subjects', { code: newSubCode, name: newSubName });
      setSubjects([...subjects, { ...res.data.subject, classes: [] }]);
      setShowAddSubject(false); setNewSubCode(''); setNewSubName('');
    } catch { alert('Failed to create subject'); }
  };

  const createClass = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      const res = await api.post('/classes', { subjectId, name: newClassName });
      setSubjects(subjects.map(s => s.id === subjectId ? { ...s, classes: [...s.classes, res.data.classGroup] } : s));
      setAddingClassToSubject(null); setNewClassName('');
    } catch { alert('Failed to create class'); }
  };

  const logout = async () => { 
    localStorage.removeItem('token');
    await api.post('/auth/logout'); 
    navigate('/login'); 
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-canvas-soft)' }}>
      <div style={{ color: 'var(--c-ink-mute)', fontSize: '15px' }}>Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-canvas-soft)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-40 nav-stripe">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Attendance" style={{ height: '32px', width: 'auto' }} />
            <span style={{ color: 'var(--c-ink)', fontWeight: 400, fontSize: '16px', letterSpacing: '-0.2px' }}>
              Attendance
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              title="View profile"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px 4px 4px', borderRadius: 'var(--r-pill)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-canvas-soft)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--c-dark-900)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '13px', fontWeight: 400, flexShrink: 0,
              }}>
                {teacher?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block" style={{ color: 'var(--c-ink)', fontSize: '14px' }}>
                {teacher?.name?.split(' ')[0]}
              </span>
            </button>
            <button id="logout-btn" onClick={logout} className="btn btn-ghost"
              style={{ fontSize: '13px', padding: '6px 12px' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mesh Hero */}
      <div className="mesh-bg">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 fade-in">
            <div>
              <p className="text-small mb-2" style={{ color: 'var(--c-ink-mute)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {getGreeting()}
              </p>
              <h1 style={{ fontSize: '36px', fontWeight: 300, color: 'var(--c-ink)', letterSpacing: '-0.72px', lineHeight: 1.1 }}>
                {teacher?.name?.split(' ')[0]}
              </h1>
              <p className="mt-2" style={{ color: 'var(--c-ink-mute)', fontSize: '15px' }}>
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · Manage your classes and attendance below.
              </p>
            </div>
            {!showAddSubject && (
              <button onClick={() => setShowAddSubject(true)} className="btn btn-primary">
                + New subject
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-5">

        {/* Add Subject Form */}
        {showAddSubject && (
          <div className="card p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: 'var(--c-ink)', fontSize: '16px', fontWeight: 400 }}>New subject</h3>
              <button onClick={() => setShowAddSubject(false)}
                style={{ color: 'var(--c-ink-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                ✕
              </button>
            </div>
            <form onSubmit={createSubject} className="flex flex-col sm:flex-row gap-3">
              <input className="input flex-none sm:!w-32" placeholder="Code  e.g. CS101"
                value={newSubCode} onChange={e => setNewSubCode(e.target.value)} required />
              <input className="input flex-1 min-w-0" placeholder="Subject name  e.g. Data Structures"
                value={newSubName} onChange={e => setNewSubName(e.target.value)} required />
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        )}

        {/* Empty State */}
        {subjects.length === 0 ? (
          <div className="card p-16 text-center fade-in">
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>📚</div>
            <p style={{ color: 'var(--c-ink)', fontSize: '16px', fontWeight: 300 }}>No subjects yet.</p>
            <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px', marginTop: '6px' }}>Click "New subject" above to get started.</p>
          </div>
        ) : (
          subjects.map((subject, i) => {
            const isExpanded = expandedSubject === subject.id;
            const accentColor = getAccent(i);

            return (
              <div key={subject.id} className="card overflow-hidden fade-in" style={{ animationDelay: `${i * 0.04}s` }}>

                {/* Subject header */}
                <button
                  id={`subject-${subject.code}`}
                  onClick={() => toggleSubject(subject.id)}
                  className="w-full text-left"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid var(--c-hairline)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: `${accentColor}18`,
                      color: accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 500, letterSpacing: '0.3px',
                      flexShrink: 0,
                    }}>
                      {subject.code}
                    </div>
                    <div>
                      <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400, letterSpacing: '-0.15px' }}>
                        {subject.name}
                      </div>
                      <div style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '2px' }}>
                        {subject.classes.length} class group{subject.classes.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="var(--c-ink-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Expanded class groups */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px', background: 'var(--c-canvas-soft)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subject.classes.map((cls) => (
                        <div key={cls.id} className="card" style={{ padding: '20px 24px' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>{cls.name}</div>
                            <div style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '2px' }}>
                              {subject.code} · {subject.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => navigate(`/history/${cls.id}`, { state: { className: cls.name, subjectName: subject.name } })}
                              className="btn btn-ghost"
                              style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid var(--c-hairline)' }}
                            >
                              History
                            </button>
                            <button
                              onClick={() => navigate(`/roster/${cls.id}`, { state: { className: cls.name, subjectName: subject.name, colorIndex: i } })}
                              className="btn btn-ghost"
                              style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid var(--c-hairline)' }}
                            >
                              Manage Class
                            </button>
                            <button
                              onClick={() => startAttendance(subject.id, cls.id, subject.code, cls.name, i)}
                              className="btn btn-primary"
                              disabled={startingSession === cls.id}
                              style={{ fontSize: '13px', padding: '6px 14px', marginLeft: 'auto' }}
                            >
                              {startingSession === cls.id ? 'Starting…' : '▶ Start session'}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add class group */}
                      {addingClassToSubject === subject.id ? (
                        <div className="card" style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--c-ink)', fontSize: '14px' }}>New class group</span>
                            <button onClick={() => setAddingClassToSubject(null)}
                              style={{ color: 'var(--c-ink-mute)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                          <form onSubmit={(e) => createClass(e, subject.id)} style={{ display: 'flex', gap: '8px' }}>
                            <input className="input flex-1" placeholder="e.g. Section B"
                              value={newClassName} onChange={e => setNewClassName(e.target.value)} required autoFocus />
                            <button type="submit" className="btn btn-primary" style={{ fontSize: '14px', padding: '8px 14px' }}>Add</button>
                          </form>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingClassToSubject(subject.id)}
                          style={{
                            background: 'none', border: '1px dashed var(--c-hairline)',
                            borderRadius: 'var(--r-lg)', padding: '20px 24px',
                            cursor: 'pointer', color: 'var(--c-ink-mute)', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'border-color 0.15s, color 0.15s', minHeight: '100px',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-primary)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-primary)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-hairline)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-ink-mute)';
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>+</span> Add class group
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getAccent(i: number) {
  const accents = ['#533afd', '#0ea5e9', '#0fa570', '#ea2261', '#9b6829'];
  return accents[i % accents.length];
}
