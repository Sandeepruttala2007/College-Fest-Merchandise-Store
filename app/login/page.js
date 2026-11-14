'use client';
// Login page: log in, sign up and reset password in one place.
// Extras: live field checks, show/hide password, password strength bar,
// a short lock after 5 wrong passwords, and the cart reopens after login.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/StoreProvider';
import Preview from '@/components/Preview';

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

// 0 (too short) to 4 (strong)
function passwordStrength(password) {
  if (password.length < 6) return 0;
  let score = 1;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function LoginPage() {
  const { logIn, signUp, resetPassword, currentUser, isLoaded, itemCount, setIsCartOpen } = useStore();
  const router = useRouter();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', roll: '', password: '' });
  const [touched, setTouched] = useState({}); // which fields to show errors for
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Lock the form for 30 seconds after 5 wrong passwords (this is only a client-side demo lock).
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const isLocked = secondsLeft > 0;

  const justSubmitted = useRef(false);

  // Already logged in? Go to the profile (but not right after a fresh login).
  useEffect(() => {
    if (isLoaded && currentUser && !justSubmitted.current) router.replace('/profile');
  }, [isLoaded, currentUser, router]);

  // Tick the countdown while locked.
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';

  // Live checks for the fields that matter in the current mode.
  const errors = {
    name: isSignup && !form.name.trim() ? 'Enter your full name.' : '',
    roll: mode !== 'login' && !/^[A-Za-z0-9]{6,12}$/.test(form.roll.trim()) ? 'Roll number should be 6 to 12 letters or digits.' : '',
    email: !/\S+@\S+\.\S+/.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    password:
      mode === 'login'
        ? form.password ? '' : 'Enter your password.'
        : form.password.length < 6 ? 'Use at least 6 characters.' : '',
  };
  const showError = (field) => (touched[field] ? errors[field] : '');
  const strength = passwordStrength(form.password);

  function update(field) {
    return (event) => { setForm({ ...form, [field]: event.target.value }); setFormError(''); };
  }
  function blur(field) {
    return () => setTouched({ ...touched, [field]: true });
  }
  function switchMode(next) {
    setMode(next); setFormError(''); setNotice(''); setTouched({}); setShowPassword(false);
  }
  function countFailure() {
    if (failures + 1 >= 5) {
      setLockedUntil(Date.now() + 30000);
      setNow(Date.now());
      setFailures(0);
    } else {
      setFailures(failures + 1);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setNotice('');
    setTouched({ name: true, roll: true, email: true, password: true });
    if (isLocked || Object.values(errors).some(Boolean)) return;

    justSubmitted.current = true;
    setBusy(true);
    let message;
    if (isSignup) message = await signUp(form);
    else if (isReset) message = await resetPassword(form.email, form.roll, form.password);
    else message = await logIn(form.email, form.password);
    setBusy(false);

    if (message) {
      justSubmitted.current = false;
      setFormError(message);
      if (mode === 'login') countFailure();
      return;
    }
    if (isReset) {
      justSubmitted.current = false;
      switchMode('login');
      setNotice('Password updated. Log in with your new password.');
      return;
    }
    router.push('/');
    if (itemCount > 0) setIsCartOpen(true); // the cart is still waiting
  }

  const title = isSignup ? 'Create your account' : isReset ? 'Reset your password' : 'Welcome back';
  const buttonText = busy ? 'Please wait…' : isLocked ? `Try again in ${secondsLeft}s`
    : isSignup ? 'Sign up' : isReset ? 'Update password' : 'Log in';

  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <aside className="auth-brand">
          <h2>LPU’26 merch</h2>
          <p>Your fest. Your name on it.</p>
          <ul>
            <li>Track every order live</li>
            <li>Pay quickly with UPI</li>
            <li>Your details saved for next time</li>
          </ul>
          <div className="auth-art"><Preview productId="hoodie" color="#FFB800" printName="YOU" printNumber="26" /></div>
        </aside>

        <section className="auth-card">
          {!isReset && (
            <div className="row tabs" role="tablist">
              <button type="button" className="chip" aria-pressed={!isSignup} onClick={() => switchMode('login')}>Log in</button>
              <button type="button" className="chip" aria-pressed={isSignup} onClick={() => switchMode('signup')}>Sign up</button>
            </div>
          )}

          <h1>{title}</h1>
          {isReset && <p className="muted">Enter your email and roll number to set a new password.</p>}
          {notice && <p className="ok" role="status">{notice}</p>}

          <form className="form" onSubmit={submit} noValidate>
            {isSignup && (
              <label>Full name
                <input value={form.name} onChange={update('name')} onBlur={blur('name')} autoComplete="name" />
                <span className="field-err">{showError('name')}</span>
              </label>
            )}
            {mode !== 'login' && (
              <label>Roll number
                <input value={form.roll} onChange={update('roll')} onBlur={blur('roll')} />
                <span className="field-err">{showError('roll')}</span>
              </label>
            )}
            <label>College email
              <input type="email" value={form.email} onChange={update('email')} onBlur={blur('email')} autoComplete="email" />
              <span className="field-err">{showError('email')}</span>
            </label>
            <label>{isReset ? 'New password' : 'Password'}
              <span className="pw">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  onBlur={blur('password')}
                  autoComplete={isSignup || isReset ? 'new-password' : 'current-password'}
                />
                <button type="button" className="link" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
              <span className="field-err">{showError('password')}</span>
            </label>

            {mode !== 'login' && form.password && (
              <div>
                <div className="strength" data-level={strength}><span /><span /><span /><span /></div>
                <small className="muted">Password strength: {STRENGTH_LABELS[strength]}</small>
              </div>
            )}

            {formError && <p className="err" role="alert">{formError}</p>}
            {mode === 'login' && failures >= 2 && !isLocked && (
              <p className="muted">{5 - failures} attempts left before a short lock.</p>
            )}
            {isLocked && <p className="err" role="alert">Too many wrong attempts. Please wait {secondsLeft}s.</p>}

            <button className="btn" disabled={busy || isLocked}>{buttonText}</button>
          </form>

          <p className="auth-links">
            {mode === 'login' && <button type="button" className="link" onClick={() => switchMode('reset')}>Forgot password?</button>}
            {isReset && <button type="button" className="link" onClick={() => switchMode('login')}>Back to log in</button>}
          </p>
        </section>
      </div>
    </main>
  );
}
