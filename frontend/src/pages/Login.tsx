import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logoImg from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('teacher@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (isSignup) {
        res = await api.post('/auth/signup', { name, email, password });
      } else {
        res = await api.post('/auth/login', { email, password });
      }
      
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(msg ?? (isSignup ? 'Signup failed. Please try again.' : 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    if (isSignup) {
      setEmail('teacher@demo.com');
      setPassword('password123');
    } else {
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 mesh-bg">
      <div className="w-full max-w-sm fade-in">
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src={logoImg}
            alt="Attendance logo"
            style={{ height: '64px', width: 'auto', marginBottom: '14px', display: 'inline-block' }}
          />
          <h1 style={{ color: 'var(--c-ink)', fontSize: '20px', fontWeight: 300, letterSpacing: '-0.2px' }}>
            Attendance
          </h1>
          <p className="text-body mt-1" style={{ color: 'var(--c-ink-mute)' }}>
            Smart classroom attendance for educators
          </p>
        </div>

        {/* Sign-in / Sign-up card */}
        <div className="card p-8">
          <h2 className="text-h3 mb-1" style={{ color: 'var(--c-ink)' }}>
            {isSignup ? 'Create an account' : 'Sign in to your account'}
          </h2>
          <p className="text-small mb-6" style={{ color: 'var(--c-ink-mute)' }}>
            {isSignup ? 'Enter your details below to get started.' : 'Enter your credentials below to continue.'}
          </p>

          {error && (
            <div
              className="mb-5 p-3 rounded-lg text-sm"
              style={{ background: 'var(--c-danger-bg)', color: 'var(--c-danger)', borderRadius: 'var(--r-md)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              id="login-btn"
              className="btn btn-primary w-full justify-center mt-2"
              style={{ fontSize: '15px', paddingTop: '10px', paddingBottom: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {isSignup ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                isSignup ? 'Sign up →' : 'Sign in →'
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: '1px solid var(--c-hairline)' }}
          >
            <p className="text-small" style={{ color: 'var(--c-ink-mute)', marginBottom: '8px' }}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                style={{ color: 'var(--c-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
            {!isSignup && (
              <p className="text-small" style={{ color: 'var(--c-ink-mute)', opacity: 0.7 }}>
                Demo credentials: <span className="tabular-nums" style={{ color: 'var(--c-ink)' }}>teacher@demo.com</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
