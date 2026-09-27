import { useEffect, useId, useRef, useState } from 'react';
import Button from '../../components/atoms/Button/Button';
import { useAuth } from '../../auth/useAuth';
import { isKnownDevice } from '../../services/authService';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import styles from './AuthPage.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/;

const COPY = {
  signUp: {
    title: ['Train smarter.', 'Track everything.'],
    subtitle: 'Create your IronBase account to keep every set in sync across your devices.',
    submit: 'Create Account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign In',
  },
  signIn: {
    title: ['Welcome back.'],
    subtitle: 'Sign in to pick up where you left off — on this device or any other.',
    submit: 'Sign In',
    switchPrompt: 'New to IronBase?',
    switchAction: 'Create an account',
  },
};

function validate(mode, values) {
  const errors = {};
  if (mode === 'signUp') {
    if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
    if (!USERNAME_RE.test(values.username.trim())) errors.username = 'Use 3–24 letters, numbers, periods, or underscores.';
    if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  } else {
    if (!values.identifier.trim()) errors.identifier = 'Enter your email or username.';
    if (!values.password) errors.password = 'Enter your password.';
  }
  return errors;
}

function Field({ label, error, hint, type = 'text', value, onChange, autoComplete, inputRef, trailing, inputMode, autoCapitalize = 'none' }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;
  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ''}`}>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect="off"
          spellCheck={false}
          inputMode={inputMode}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
        />
        <label htmlFor={id} className={styles.floatingLabel}>{label}</label>
        {trailing}
      </div>
      <div className={styles.messageSlot}>
        {message && (
          <p key={message} id={messageId} className={error ? styles.errorText : styles.hintText}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { authenticate, enter, notice } = useAuth();
  const [mode, setMode] = useState(() => (notice || isKnownDevice() ? 'signIn' : 'signUp'));
  const [values, setValues] = useState({ email: '', username: '', identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [leaving, setLeaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const firstFieldRef = useRef(null);
  const copy = COPY[mode];

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  function update(key) {
    return (e) => {
      const value = e.target.value;
      setValues(v => ({ ...v, [key]: value }));
      if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
      if (formError) setFormError(null);
    };
  }

  function switchMode() {
    setMode(m => (m === 'signUp' ? 'signIn' : 'signUp'));
    setErrors({});
    setFormError(null);
    requestAnimationFrame(() => firstFieldRef.current?.focus({ preventScroll: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status !== 'idle') return;

    const found = validate(mode, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(null);
      return;
    }

    setStatus('loading');
    setFormError(null);
    try {
      const fields = mode === 'signUp'
        ? { email: values.email.trim(), username: values.username.trim(), password: values.password }
        : { identifier: values.identifier.trim(), password: values.password };
      const user = await authenticate(mode, fields);
      setValues(v => ({ ...v, password: '' }));
      setStatus('success');

      const reduced = prefersReducedMotion();
      setTimeout(() => setLeaving(true), reduced ? 0 : 420);
      setTimeout(() => enter(user), reduced ? 0 : 700);
    } catch (err) {
      setStatus('idle');
      if (err.field && mode === 'signUp') {
        setErrors({ [err.field]: err.message });
      } else if (err.status === 401) {
        setErrors({});
        setFormError('Invalid email, username, or password.');
      } else {
        setFormError(err.message);
      }
    }
  }

  return (
    <div className={`${styles.page} ${leaving ? styles.leaving : ''}`}>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.glowPrimary} />
        <span className={styles.glowAccent} />
      </div>

      <div className={styles.layout}>
        <section className={styles.intro}>
          <div className={styles.wordmark}>
            <span className={styles.mark} aria-hidden="true" />
            IronBase
          </div>
          <h1 key={mode} className={styles.title}>
            {copy.title.map((line, i) => (
              <span key={line} className={styles.titleLine} style={{ '--i': i }}>{line}</span>
            ))}
          </h1>
          <p key={`${mode}-sub`} className={styles.subtitle}>{copy.subtitle}</p>
        </section>

        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby="auth-heading">
          <h2 id="auth-heading" className="visually-hidden">{mode === 'signUp' ? 'Create account' : 'Sign in'}</h2>

          {notice && mode === 'signIn' && (
            <p className={styles.notice} role="status">{notice}</p>
          )}
          {!online && (
            <p className={styles.notice} role="status">You’re offline. Connect to the internet to {mode === 'signUp' ? 'create an account' : 'sign in'}.</p>
          )}

          <div className={styles.fields}>
            {mode === 'signUp' ? (
              <Field
                key="email"
                inputRef={firstFieldRef}
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={update('email')}
                error={errors.email}
              />
            ) : (
              <Field
                key="identifier"
                inputRef={firstFieldRef}
                label="Email or username"
                autoComplete="username"
                value={values.identifier}
                onChange={update('identifier')}
                error={errors.identifier}
              />
            )}

            <div className={`${styles.collapsible} ${mode === 'signUp' ? styles.expanded : ''}`} inert={mode !== 'signUp'}>
              <div className={styles.collapsibleInner}>
                <Field
                  label="Username"
                  autoComplete="username"
                  value={values.username}
                  onChange={update('username')}
                  error={errors.username}
                />
              </div>
            </div>

            <Field
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              value={values.password}
              onChange={update('password')}
              error={errors.password}
              hint={mode === 'signUp' ? 'At least 8 characters.' : undefined}
              trailing={
                <button
                  type="button"
                  className={styles.reveal}
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    <path className={`${styles.slash} ${showPassword ? '' : styles.slashHidden}`} d="M4 20L20 4" />
                  </svg>
                </button>
              }
            />
          </div>

          <div className={styles.formErrorSlot} aria-live="polite">
            {formError && <p key={formError} className={styles.formError}>{formError}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth status={status}>
            {copy.submit}
          </Button>

          <p className={styles.switch}>
            <span>{copy.switchPrompt}</span>{' '}
            <button type="button" className={styles.switchButton} onClick={switchMode} disabled={status !== 'idle'}>
              {copy.switchAction}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
