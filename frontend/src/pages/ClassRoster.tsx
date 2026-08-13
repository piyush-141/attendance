import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

interface Student {
  id: string;
  rollNo: string;
  name: string;
}

const CATEGORY_COLORS = [
  { tint: 'var(--violet-tint)', accent: 'var(--violet-accent)' },
  { tint: 'var(--sky-tint)', accent: 'var(--sky-accent)' },
  { tint: 'var(--sand-tint)', accent: 'var(--sand-accent)' },
  { tint: 'var(--mint-tint)', accent: 'var(--mint-accent)' },
  { tint: 'var(--coral-tint)', accent: 'var(--coral-accent)' },
];

export default function ClassRoster() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    className?: string;
    subjectName?: string;
    colorIndex?: number;
  } | null;

  const className = locationState?.className ?? 'Class';
  const subjectName = locationState?.subjectName ?? 'Subject';
  const colorIndex = locationState?.colorIndex ?? 1;
  const colors = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Add State
  const [bulkText, setBulkText] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Single Add State (Secondary)
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [addingSingle, setAddingSingle] = useState(false);

  useEffect(() => {
    if (!classId) return;
    loadRoster();
  }, [classId, navigate]);

  const loadRoster = async () => {
    try {
      const res = await api.get(`/classes/${classId}/roster`);
      setStudents(res.data.roster || []);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setBulkAdding(true);
    setBulkMessage(null);

    // Parse the pasted text. Excel pastes as:
    // Roll1 \t Name1 \n Roll2 \t Name2
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedStudents: { rollNo: string; name: string }[] = [];

    for (const line of lines) {
      // Split by tab (Excel/Sheets) or comma/space fallback
      const parts = line.split(/\t/).map(p => p.trim());

      if (parts.length >= 2) {
        parsedStudents.push({
          rollNo: parts[0].toUpperCase(),
          name: parts.slice(1).join(' '), // In case name contains tabs somehow
        });
      }
    }

    if (parsedStudents.length === 0) {
      setBulkMessage({ type: 'error', text: 'Could not parse students. Ensure format is "RollNo [TAB] Name".' });
      setBulkAdding(false);
      return;
    }

    try {
      const res = await api.post(`/classes/${classId}/students/batch`, { students: parsedStudents });
      setBulkMessage({ type: 'success', text: `Successfully imported ${res.data.count} new students.` });
      setBulkText('');
      await loadRoster(); // Refresh the list
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to import students';
      setBulkMessage({ type: 'error', text: msg ?? 'Import failed' });
    } finally {
      setBulkAdding(false);
    }
  };

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim()) return;

    setAddingSingle(true);

    try {
      const res = await api.post(`/classes/${classId}/students`, {
        rollNo: rollNo.trim().toUpperCase(),
        name: name.trim()
      });
      setStudents([...students, res.data.student]);
      setRollNo('');
      setName('');
      setShowSingleAdd(false);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to add student';
      alert(msg ?? 'Failed to add student');
    } finally {
      setAddingSingle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-h3 text-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Top Bar */}
      <nav className="sticky top-0 z-40 bg-surface shadow-[0_1px_3px_rgba(43,36,20,0.02)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button id="back-from-roster" onClick={() => navigate('/dashboard')} className="btn btn-ghost px-2 py-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="h-6 w-px bg-[var(--color-border)]"></div>
          <span className="text-h2 text-primary">
            {subjectName} · Manage Class
          </span>
          <span className="badge badge-ended ml-2 bg-surface-alt">{className}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Controls Column */}
          <div className="md:col-span-1 space-y-6 fade-in">

            {/* Bulk Import Card (Primary) */}
            <div className="card p-6" style={{ borderTop: `4px solid ${colors.accent}` }}>
              <h3 className="text-h3 text-primary mb-2">Import from Excel</h3>
              <p className="text-small text-secondary mb-4">
                Copy columns (Roll No, Name) from Excel or Sheets and paste them below.
              </p>

              {bulkMessage && (
                <div className={`mb-4 p-3 rounded-[var(--radius-sm)] text-small font-medium ${bulkMessage.type === 'success' ? 'bg-[var(--mint-tint)] text-[var(--mint-accent)]' : 'bg-[var(--coral-tint)] text-[var(--color-danger)]'
                  }`}>
                  {bulkMessage.text}
                </div>
              )}

              <form onSubmit={handleBulkAdd} className="space-y-4">
                <textarea
                  className="input min-h-[140px] font-mono text-xs whitespace-pre"
                  placeholder={"BT24CSE225\tLaksh Agrawal\nBT24CSE310\tAnkit Jaiswal"}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center mt-2"
                  disabled={bulkAdding}
                >
                  {bulkAdding ? 'Importing...' : 'Bulk Import'}
                </button>
              </form>
            </div>

            {/* Single Add Card (Secondary) */}
            <div className="card p-6 bg-[var(--color-surface-alt)] border border-color">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-h3 text-primary">Manual Entry</h3>
                <button
                  onClick={() => setShowSingleAdd(!showSingleAdd)}
                  className="text-secondary hover:text-primary text-xl font-bold"
                >
                  {showSingleAdd ? '−' : '+'}
                </button>
              </div>
              <p className="text-small text-secondary mb-4">Add a single student.</p>

              {showSingleAdd && (
                <form onSubmit={handleSingleAdd} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="label">Roll Number</label>
                    <input
                      className="input"
                      placeholder="e.g. DWA001"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      required
                      autoCapitalize="characters"
                    />
                  </div>
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      className="input"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary w-full justify-center"
                    disabled={addingSingle}
                  >
                    {addingSingle ? 'Adding...' : 'Add Single Student'}
                  </button>
                </form>
              )}
            </div>

            {/* Total Count */}
            <div className="card p-6 border border-color shadow-none flex items-center justify-between">
              <div>
                <h3 className="text-h1 tabular-nums text-primary leading-tight">{students.length}</h3>
                <p className="text-small text-secondary font-semibold">Total Enrolled</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                👥
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="md:col-span-2 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card overflow-hidden h-full min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-color bg-surface-alt flex items-center justify-between">
                <h2 className="text-h2 text-primary">Manage Class</h2>
                <div className="text-small font-semibold text-[var(--mint-accent)] bg-[var(--mint-tint)] px-3 py-1 rounded-[var(--radius-sm)]">
                  Live Sync
                </div>
              </div>

              <div className="flex-1 overflow-x-auto bg-surface">
                {students.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="text-5xl mb-4 opacity-50">📭</div>
                    <h3 className="text-h3 text-primary mb-1">No students yet</h3>
                    <p className="text-body text-secondary">Paste data from Excel to enroll students.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-color text-label">
                        <th className="py-4 px-6 font-semibold w-16">#</th>
                        <th className="py-4 px-6 font-semibold">Roll No</th>
                        <th className="py-4 px-6 font-semibold">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-color">
                      {students.map((student, i) => (
                        <tr key={student.id} className="hover:bg-surface-alt transition-colors">
                          <td className="py-4 px-6 text-body text-tertiary tabular-nums">{i + 1}</td>
                          <td className="py-4 px-6">
                            <span className="badge bg-surface-alt text-primary font-mono">{student.rollNo}</span>
                          </td>
                          <td className="py-4 px-6 text-body font-semibold text-primary">{student.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
