import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logoImg from '../assets/logo.png';

interface ClassGroup { id: string; name: string; }
interface Subject { id: string; code: string; name: string; classes: ClassGroup[]; }
interface Teacher { name: string; email: string; }

export default function Profile() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const startEditName = () => {
    setEditNameValue(teacher?.name ?? '');
    setIsEditingName(true);
  };

  const saveName = async () => {
    if (!editNameValue.trim() || editNameValue === teacher?.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await api.patch('/auth/me', { name: editNameValue.trim() });
      setTeacher(res.data.teacher);
      setIsEditingName(false);
    } catch {
      alert('Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Delete confirmation state
  const [deletingSubject, setDeletingSubject] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<
    { type: 'subject'; id: string; name: string } |
    { type: 'class'; id: string; name: string; subjectId: string } |
    null
  >(null);

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

  const askDelete = (item: typeof pendingDelete) => {
    setPendingDelete(item);
  };

  const cancelDelete = () => { setPendingDelete(null); };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.type === 'subject') {
        setDeletingSubject(pendingDelete.id);
        await api.delete(`/subjects/${pendingDelete.id}`);
        setSubjects(prev => prev.filter(s => s.id !== pendingDelete.id));
      } else {
        setDeletingClass(pendingDelete.id);
        await api.delete(`/classes/${pendingDelete.id}`);
        setSubjects(prev => prev.map(s => ({
          ...s,
          classes: s.classes.filter(c => c.id !== pendingDelete.id),
        })));
      }
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingSubject(null);
      setDeletingClass(null);
      setPendingDelete(null);
    }
  };

  const logout = async () => { await api.post('/auth/logout'); navigate('/login'); };

  const totalClasses = subjects.reduce((n, s) => n + s.classes.length, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-canvas-soft)' }}>
      <div style={{ color: 'var(--c-ink-mute)', fontSize: '15px' }}>Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--c-canvas-soft)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-40 nav-stripe">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--c-hairline)' }} />
            <img src={logoImg} alt="Attendance" style={{ height: '26px', width: 'auto' }} />
            <span style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>Profile</span>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ fontSize: '13px', padding: '6px 12px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Profile card */}
        <div className="card p-8 fade-in" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--c-dark-900)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '22px', fontWeight: 300, flexShrink: 0,
          }}>
            {teacher?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <input
                  className="input"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  disabled={savingName}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  style={{ fontSize: '20px', padding: '4px 10px', width: '220px' }}
                />
                <button
                  onClick={saveName}
                  disabled={savingName || !editNameValue.trim()}
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: '13px' }}
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={savingName}
                  className="btn btn-ghost"
                  style={{ padding: '4px 12px', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--c-ink)', fontSize: '22px', fontWeight: 300, letterSpacing: '-0.3px' }}>
                  {teacher?.name}
                </div>
                <button
                  onClick={startEditName}
                  style={{
                    background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                    color: 'var(--c-ink-mute)', display: 'flex', alignItems: 'center',
                    borderRadius: '4px', transition: 'background 0.1s, color 0.1s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-canvas)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-ink)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-ink-mute)';
                  }}
                  title="Edit name"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              </div>
            )}
            <div style={{ color: 'var(--c-ink-mute)', fontSize: '14px', marginTop: '3px' }}>
              {teacher?.email}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 300, color: 'var(--c-ink)', letterSpacing: '-0.4px' }}>
                {subjects.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-ink-mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Subjects
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--c-hairline)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 300, color: 'var(--c-ink)', letterSpacing: '-0.4px' }}>
                {totalClasses}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-ink-mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Classes
              </div>
            </div>
          </div>
        </div>

        {/* Subjects & Classes */}
        <div className="card overflow-hidden fade-in">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--c-hairline)' }}>
            <div style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>Subjects & Classes</div>
            <div style={{ color: 'var(--c-ink-mute)', fontSize: '13px', marginTop: '2px' }}>
              Manage your subjects and class groups
            </div>
          </div>

          {subjects.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--c-ink-mute)', fontSize: '14px' }}>
              No subjects yet. Go to dashboard to add one.
            </div>
          ) : (
            <div>
              {subjects.map((subject, si) => (
                <div key={subject.id} style={{
                  borderBottom: si < subjects.length - 1 ? '1px solid var(--c-hairline)' : 'none',
                }}>
                  {/* Subject row — clickable to expand */}
                  <div style={{
                    padding: '16px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    background: 'var(--c-canvas)',
                  }}>
                    {/* Left: clickable toggle */}
                    <button
                      onClick={() => toggleSubject(subject.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: `${getAccent(si)}15`, color: getAccent(si),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 500, letterSpacing: '0.3px', flexShrink: 0,
                      }}>
                        {subject.code}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: 'var(--c-ink)', fontSize: '14px', fontWeight: 400 }}>{subject.name}</div>
                        <div style={{ color: 'var(--c-ink-mute)', fontSize: '12px', marginTop: '1px' }}>
                          {subject.classes.length} class{subject.classes.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="var(--c-ink-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          flexShrink: 0, marginRight: '8px',
                          transform: expandedSubjects.has(subject.id) ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.18s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {/* Right: delete */}
                    <button
                      onClick={() => askDelete({ type: 'subject', id: subject.id, name: subject.name })}
                      disabled={deletingSubject === subject.id}
                      style={{
                        background: 'none', border: '1px solid var(--c-hairline)',
                        borderRadius: 'var(--r-pill)', padding: '5px 12px',
                        fontSize: '12px', color: 'var(--c-danger)', cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                        opacity: deletingSubject === subject.id ? 0.5 : 1,
                        transition: 'background 0.12s, border-color 0.12s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-danger-bg)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-danger)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'none';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-hairline)';
                      }}
                    >
                      {deletingSubject === subject.id ? 'Deleting…' : 'Delete subject'}
                    </button>
                  </div>

                  {/* Class rows — only shown when expanded */}
                  {expandedSubjects.has(subject.id) && subject.classes.map((cls) => (
                    <div key={cls.id} style={{
                      padding: '12px 24px 12px 72px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                      borderTop: '1px solid var(--c-hairline)',
                      background: 'var(--c-canvas-soft)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: getAccent(si), flexShrink: 0,
                        }} />
                        <span style={{ color: 'var(--c-ink)', fontSize: '14px' }}>{cls.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => navigate(`/roster/${cls.id}`, { state: { className: cls.name, subjectName: subject.name } })}
                          style={{
                            background: 'none', border: '1px solid var(--c-hairline)',
                            borderRadius: 'var(--r-pill)', padding: '4px 10px',
                            fontSize: '12px', color: 'var(--c-ink)', cursor: 'pointer',
                            fontFamily: 'inherit', whiteSpace: 'nowrap',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-canvas)'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                        >
                          Manage class
                        </button>
                        <button
                          onClick={() => askDelete({ type: 'class', id: cls.id, name: cls.name, subjectId: subject.id })}
                          disabled={deletingClass === cls.id}
                          style={{
                            background: 'none', border: '1px solid var(--c-hairline)',
                            borderRadius: 'var(--r-pill)', padding: '4px 10px',
                            fontSize: '12px', color: 'var(--c-danger)', cursor: 'pointer',
                            fontFamily: 'inherit', whiteSpace: 'nowrap',
                            opacity: deletingClass === cls.id ? 0.5 : 1,
                            transition: 'background 0.12s, border-color 0.12s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-danger-bg)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-danger)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'none';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-hairline)';
                          }}
                        >
                          {deletingClass === cls.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(13,37,61,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
          onClick={cancelDelete}
        >
          <div
            className="card p-8 fade-in"
            style={{ width: '100%', maxWidth: '420px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--c-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div style={{ color: 'var(--c-ink)', fontSize: '16px', fontWeight: 400 }}>
                Delete {pendingDelete.type === 'subject' ? 'subject' : 'class'}?
              </div>
            </div>

            <p style={{ color: 'var(--c-ink-mute)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
              This will permanently delete <strong style={{ color: 'var(--c-ink)' }}>{pendingDelete.name}</strong>
              {pendingDelete.type === 'subject'
                ? ' along with all its class groups, sessions, and attendance records.'
                : ' along with all its sessions and attendance records.'}
              {' '}This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={confirmDelete}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center', color: 'var(--c-danger)', border: '1px solid var(--c-danger-bg)' }}
              >
                Delete permanently
              </button>
              <button onClick={cancelDelete} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAccent(i: number) {
  const accents = ['#533afd', '#0ea5e9', '#0fa570', '#ea2261', '#9b6829'];
  return accents[i % accents.length];
}
