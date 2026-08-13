import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Session {
  id: string;
  status: string;
  startedAt: string;
  _count: { records: number };
}

export default function ClassHistory() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    className?: string;
    subjectName?: string;
  } | null;

  const className = locationState?.className ?? 'Class';
  const subjectName = locationState?.subjectName ?? 'Subject';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Planned lectures setting
  const [plannedLectures, setPlannedLectures] = useState<number>(30);
  const [editingPlanned, setEditingPlanned] = useState(false);
  const [plannedInput, setPlannedInput] = useState<string>('30');
  const [savingPlanned, setSavingPlanned] = useState(false);

  useEffect(() => {
    if (!classId) return;
    api.get(`/classes/${classId}/records`)
      .then((res) => setSessions(res.data.sessions || []))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));

    // Fetch current plannedLectures from report endpoint meta
    api.get(`/classes/${classId}/report`)
      .then((res) => {
        const pl = res.data.plannedLectures ?? 30;
        setPlannedLectures(pl);
        setPlannedInput(String(pl));
      })
      .catch(() => {});
  }, [classId, navigate]);

  const savePlannedLectures = async () => {
    const val = parseInt(plannedInput, 10);
    if (!val || val < 1) return;
    setSavingPlanned(true);
    try {
      const res = await api.patch(`/classes/${classId}/planned-lectures`, { plannedLectures: val });
      setPlannedLectures(res.data.plannedLectures);
      setEditingPlanned(false);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSavingPlanned(false);
    }
  };

  const exportReport = async () => {
    try {
      const res = await api.get(`/classes/${classId}/report`);
      const reportData = res.data;

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Attendance';
      const ws = wb.addWorksheet('Attendance', {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      });

      const sessionCount: number = reportData.sessions.length;
      // Use the teacher-defined planned lectures count (or sessions count if more sessions than planned)
      const dateCols = Math.max(sessionCount, reportData.plannedLectures ?? plannedLectures);
      const totalCols = 3 + dateCols + 3;

      // ── Column widths ─────────────────────────────────────────────────────
      ws.getColumn(1).width = 6;
      ws.getColumn(2).width = 28;
      ws.getColumn(3).width = 14;
      for (let i = 0; i < dateCols; i++) ws.getColumn(4 + i).width = 4.2;
      ws.getColumn(3 + dateCols + 1).width = 14;
      ws.getColumn(3 + dateCols + 2).width = 13;
      ws.getColumn(3 + dateCols + 3).width = 11;

      // ── Helpers ───────────────────────────────────────────────────────────
      const thin = { style: 'thin' as const };
      const allBorder = { top: thin, left: thin, bottom: thin, right: thin };
      const medBorder = {
        top: { style: 'medium' as const }, left: { style: 'medium' as const },
        bottom: { style: 'medium' as const }, right: { style: 'medium' as const },
      };

      type HAlign = ExcelJS.Alignment['horizontal'];
      type VAlign = ExcelJS.Alignment['vertical'];

      const sc = (
        row: number, col: number, value: ExcelJS.CellValue,
        o: {
          bold?: boolean; size?: number; color?: string;
          h?: HAlign; v?: VAlign; wrap?: boolean; rotate?: number;
          fill?: string; border?: Partial<ExcelJS.Borders>; font?: string;
        } = {}
      ) => {
        const cell = ws.getCell(row, col);
        cell.value = value;
        cell.font = {
          name: o.font ?? 'Times New Roman', size: o.size ?? 10,
          bold: o.bold ?? false,
          color: o.color ? { argb: o.color } : undefined,
        };
        cell.alignment = {
          horizontal: o.h ?? 'center', vertical: o.v ?? 'middle',
          wrapText: o.wrap ?? false, textRotation: o.rotate,
        };
        if (o.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: o.fill } };
        if (o.border) cell.border = o.border as ExcelJS.Borders;
      };

      // ── Row heights ───────────────────────────────────────────────────────
      ws.getRow(1).height = 20;
      ws.getRow(2).height = 16;
      ws.getRow(3).height = 20;
      ws.getRow(4).height = 18;
      ws.getRow(5).height = 20;
      ws.getRow(6).height = 16;
      ws.getRow(7).height = 110;

      // Pre-populate blank cells so rows exist before merging
      for (let r = 1; r <= 7; r++) {
        for (let c = 1; c <= totalCols; c++) {
          ws.getCell(r, c).value = null;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // LOGO block A1:B6 merged
      // ══════════════════════════════════════════════════════════════════════
      ws.mergeCells(1, 1, 6, 2);
      sc(1, 1, 'IIITN', { bold: true, size: 28, color: 'FF000080', h: 'center', v: 'middle' });
      ws.getCell(1, 1).border = medBorder;

      // ══════════════════════════════════════════════════════════════════════
      // Header rows C→totalCols
      // ══════════════════════════════════════════════════════════════════════
      const hdr = (row: number, text: string, bold = false, size = 11) => {
        ws.mergeCells(row, 3, row, totalCols);
        sc(row, 3, text, { bold, size, h: 'center', v: 'middle' });
      };
      hdr(1, 'ATTENDANCE', true, 16);
      hdr(2, 'SESSION 2026-2027 (Jul to Dec 2026)', false, 11);
      hdr(3, reportData.subjectName.toUpperCase(), true, 13);
      hdr(4, `( ${reportData.className} )`, true, 11);
      hdr(5, `COURSE INSTRUCTOR :- ${reportData.teacherName}`, true, 11);

      // ══════════════════════════════════════════════════════════════════════
      // Row 6: lecture numbers 1…dateCols + "Lecture Started" over summary cols
      // ══════════════════════════════════════════════════════════════════════
      sc(6, 1, '', { border: allBorder });
      sc(6, 2, '', { border: allBorder });
      sc(6, 3, '', { border: allBorder });

      for (let i = 0; i < dateCols; i++) {
        sc(6, 4 + i, i + 1, { bold: true, size: 8, h: 'center', v: 'middle', border: allBorder });
      }

      ws.mergeCells(6, 3 + dateCols + 1, 6, totalCols);
      sc(6, 3 + dateCols + 1, 'Lecture Started', {
        bold: true, size: 9, h: 'center', v: 'middle', fill: 'FF9BC2E6', border: allBorder,
      });

      // ══════════════════════════════════════════════════════════════════════
      // Row 7: column headers with vertical date text
      // ══════════════════════════════════════════════════════════════════════
      sc(7, 1, 'Sr no', { bold: true, size: 9, h: 'center', v: 'middle', wrap: true, border: allBorder });
      sc(7, 2, 'NAME OF STUDENTS', { bold: true, size: 9, h: 'center', v: 'middle', wrap: true, border: allBorder });
      sc(7, 3, 'ROLL NO', { bold: true, size: 9, h: 'center', v: 'middle', wrap: true, border: allBorder });

      for (let i = 0; i < dateCols; i++) {
        const dateText = i < sessionCount ? reportData.sessions[i].date : '';
        sc(7, 4 + i, dateText, {
          bold: !!dateText, size: 9,
          h: 'center', v: 'bottom', rotate: 90, border: allBorder,
        });
      }

      const summaryHdrs = [
        'TOTAL NO OF LECTURE CONDUCTED',
        'No of Lectures Attended',
        '% Attendance',
      ];
      for (let i = 0; i < 3; i++) {
        sc(7, 3 + dateCols + 1 + i, summaryHdrs[i], {
          bold: true, size: 8, h: 'center', v: 'middle',
          wrap: true, fill: 'FF9BC2E6', border: allBorder,
        });
      }

      // ══════════════════════════════════════════════════════════════════════
      // Rows 8+: student data
      // ══════════════════════════════════════════════════════════════════════
      let srNo = 1;
      let rowNum = 8;

      for (const student of reportData.students) {
        ws.getRow(rowNum).height = 16;
        sc(rowNum, 1, srNo++, { size: 9, h: 'center', v: 'middle', border: allBorder });
        sc(rowNum, 2, student.name, { size: 9, h: 'left', v: 'middle', border: allBorder });
        sc(rowNum, 3, student.rollNo, { size: 9, h: 'center', v: 'middle', border: allBorder });

        let attended = 0;
        for (let i = 0; i < dateCols; i++) {
          let val = '';
          if (i < sessionCount && student.attendance[reportData.sessions[i].id]) {
            val = 'P';
            attended++;
          }
          sc(rowNum, 4 + i, val, {
            size: 9, bold: val === 'P', h: 'center', v: 'middle', border: allBorder,
            fill: val === 'P' ? 'FFE2EFDA' : undefined,
          });
        }

        const totalConducted = sessionCount;
        const pct = totalConducted > 0 ? Math.round((attended / totalConducted) * 100) : 0;

        sc(rowNum, 3 + dateCols + 1, totalConducted, { size: 9, bold: true, h: 'center', v: 'middle', border: allBorder });
        sc(rowNum, 3 + dateCols + 2, attended, { size: 9, bold: true, h: 'center', v: 'middle', border: allBorder });
        sc(rowNum, 3 + dateCols + 3, `${pct}%`, {
          size: 9, bold: true, h: 'center', v: 'middle', border: allBorder,
          fill: pct >= 75 ? 'FFE2EFDA' : 'FFFFC7CE',
          color: pct >= 75 ? 'FF375623' : 'FF9C0006',
        });

        rowNum++;
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const safeName = reportData.className.replace(/[^a-z0-9]/gi, '_');
      saveAs(blob, `Attendance_${safeName}.xlsx`);

    } catch (err) {
      alert('Failed to export report. Please try again.');
      console.error(err);
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
    <div className="min-h-screen pb-16" style={{ background: 'var(--c-canvas-soft)' }}>
      {/* Top Bar */}
      <nav className="sticky top-0 z-40 nav-stripe">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <button id="back-from-history" onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--c-hairline)' }} />
          <span style={{ color: 'var(--c-ink)', fontSize: '15px', fontWeight: 400 }}>
            {subjectName} · History
          </span>
          <span className="badge badge-ended">{className}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Settings Card */}
        <div className="card p-6 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-h3 text-primary mb-1">Report Settings</h3>
              <p className="text-small text-secondary">
                Total planned lectures for this class. This sets how many date columns appear in the Excel sheet.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {editingPlanned ? (
                <>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={plannedInput}
                    onChange={(e) => setPlannedInput(e.target.value)}
                    className="input w-24 text-center font-mono text-h3"
                    onKeyDown={(e) => e.key === 'Enter' && savePlannedLectures()}
                    autoFocus
                  />
                  <button
                    onClick={savePlannedLectures}
                    disabled={savingPlanned}
                    className="btn btn-primary px-4 py-2 text-small"
                  >
                    {savingPlanned ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingPlanned(false); setPlannedInput(String(plannedLectures)); }}
                    className="btn btn-ghost px-3 py-2 text-small"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-h2 font-display font-bold text-primary tabular-nums">{plannedLectures}</div>
                    <div className="text-label text-secondary">Total Lectures</div>
                  </div>
                  <button
                    onClick={() => setEditingPlanned(true)}
                    className="btn btn-secondary px-4 py-2 text-small"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List Card */}
        <div className="card overflow-hidden fade-in">
          <div className="p-6 border-b border-color bg-surface-alt flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-h2 text-primary mb-1">All Past Sessions</h2>
              <div className="text-small font-semibold text-secondary tabular-nums">
                {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={exportReport}
              className="btn btn-secondary text-small px-4 py-2 bg-white"
            >
              <span className="mr-2">📊</span> Export to Excel
            </button>
          </div>

          <div className="bg-surface p-2">
            {sessions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-5xl mb-4 opacity-50">📭</div>
                <h3 className="text-h3 text-primary mb-1">No sessions yet</h3>
                <p className="text-body text-secondary">Start a session from the dashboard to see history here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => navigate(`/records/${sess.id}`)}
                    className="w-full bg-surface text-left flex items-center justify-between rounded-[var(--radius-md)] px-6 py-4 hover:shadow-md transition-all border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  >
                    <div>
                      <div className="text-body font-semibold text-primary mb-1">
                        {new Date(sess.startedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-small text-secondary tabular-nums">
                        {new Date(sess.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-h3 text-primary tabular-nums">{sess._count.records}</div>
                        <div className="text-label text-secondary">Present</div>
                      </div>
                      <span className={`badge badge-${sess.status.toLowerCase()}`}>
                        {sess.status === 'ACTIVE' ? 'Live' : 'Ended'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
