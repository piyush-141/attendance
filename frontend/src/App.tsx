import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionView from './pages/SessionView';
import StudentScan from './pages/StudentScan';
import RecordsView from './pages/RecordsView';
import ClassRoster from './pages/ClassRoster';
import ClassHistory from './pages/ClassHistory';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session/:sessionId" element={<SessionView />} />
        <Route path="/records/:sessionId" element={<RecordsView />} />
        <Route path="/roster/:classId" element={<ClassRoster />} />
        <Route path="/history/:classId" element={<ClassHistory />} />
        <Route path="/profile" element={<Profile />} />
        {/* Student-facing — no auth required */}
        <Route path="/scan/:qrToken" element={<StudentScan />} />
      </Routes>
    </BrowserRouter>
  );
}
