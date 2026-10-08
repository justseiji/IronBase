import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import LogoMark from '../../components/atoms/LogoMark/LogoMark';
import { useAuth } from '../../auth/useAuth';
import { isKnownDevice, requestPasswordReset } from '../../services/authService';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import styles from './AuthPage.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/;
const RESEND_COOLDOWN_S = 60;

// Which inputs each state of the screen shows, in order.
const FIELDS = {
  signUp: ['email', 'username', 'password'],
  signIn: ['identifier', 'password'],
  forgot: ['email'],
  sent: [],
  reset: ['password'],
  linkInvalid: [],
};

const COPY = {
  signUp: {
    heading: 'Create account',
    title: ['Train smarter.', 'Track everything.'],
    subtitle: 'Create your IronBase account to keep every set in sync across your devices.',
    submit: 'Create Account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign In',
    switchTo: 'signIn',
  },
  signIn: {
    heading: 'Sign in',
    title: ['Welcome back.'],
    subtitle: 'Sign in to pick up where you left off — on this device or any other.',
    submit: 'Sign In',
    switchPrompt: 'New to IronBase?',
    switchAction: 'Create an account',
    switchTo: 'signUp',
  },
  forgot: {
    heading: 'Reset password',
    title: ['Reset your', 'password.'],
    subtitle: 'Enter the email on your account and we’ll send you a link to choose a new one.',
    submit: 'Send Reset Link',
    switchPrompt: 'Remembered it?',
    switchAction: 'Back to sign in',
    switchTo: 'signIn',
  },
  sent: {
    heading: 'Check your email',
    title: ['Check your email.'],
    submit: 'Resend Link',
    switchAction: 'Back to sign in',
    switchTo: 'signIn',
  },
  reset: {
    heading: 'Choose a new password',
    title: ['Choose a new', 'password.'],
    subtitle: 'You’ll be signed in here and signed out on every other device.',
    submit: 'Save Password',
    switchAction: 'Back to sign in',
    switchTo: 'signIn',
  },
  linkInvalid: {
    heading: 'Reset link expired',
    title: ['Link expired.'],
    subtitle: 'This reset link is invalid, has expired, or was already used. Request a new one to continue.',
    submit: 'Send a New Link',
    switchAction: 'Back to sign in',
    switchTo: 'signIn',
  },
};

const OFFLINE_ACTION = {
  signUp: 'create an account',
  signIn: 'sign in',
  forgot: 'reset your password',
  sent: 'resend the link',
  reset: 'save your new password',
  linkInvalid: 'request a new link',
};

function readResetToken() {
  const match = window.location.hash.match(/^#reset=([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

function validate(mode, values) {
  const errors = {};
  const needs = FIELDS[mode];
  if (needs.includes('email') && !EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (needs.includes('username') && !USERNAME_RE.test(values.username.trim())) errors.username = 'Use 3–24 letters, numbers, periods, or underscores.';
  if (needs.includes('identifier') && !values.identifier.trim()) errors.identifier = 'Enter your email or username.';
  if (needs.includes('password')) {
    if (mode === 'signIn') {
      if (!values.password) errors.password = 'Enter your password.';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
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

// Expands or collapses its content in place, so moving between states never jumps.
function Reveal({ open, children }) {
  return (
    <div className={`${styles.collapsible} ${open ? styles.expanded : ''}`} inert={!open}>
      <div className={styles.collapsibleInner}>{children}</div>
    </div>
  );
}

export default function AuthPage() {
  const { authenticate, enter, notice, status: authStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetToken, setResetToken] = useState(readResetToken);
  const [mode, setMode] = useState(() => {
    if (resetToken) return 'reset';
    return notice || isKnownDevice() ? 'signIn' : 'signUp';
  });
  const [values, setValues] = useState({ email: '', username: '', identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [formInfo, setFormInfo] = useState(null);
  const [status, setStatus] = useState('idle');
  const [leaving, setLeaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const titleRef = useRef(null);
  const copy = COPY[mode];
  const shown = FIELDS[mode];
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Take the reset token out of the address bar as soon as it has been read.
  // A link opened into a tab where this screen is already showing arrives as a
  // hash change rather than a page load, so pick that up too.
  useEffect(() => {
    function takeToken(fromHashChange) {
      const token = readResetToken();
      if (!token) return;
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      if (fromHashChange) {
        setResetToken(token);
        setMode('reset');
        setErrors({});
        setFormError(null);
        setFormInfo(null);
      }
      requestAnimationFrame(() => passwordRef.current?.focus({ preventScroll: true }));
    }
    takeToken(false);
    const onHashChange = () => takeToken(true);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  function update(key) {
    return (e) => {
      const value = e.target.value;
      setValues(v => ({ ...v, [key]: value }));
      if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
      if (formError) setFormError(null);
    };
  }

  function goTo(next) {
    // Someone already signed in who backs out of a reset link just returns to the app.
    if (authStatus === 'signedIn' && (next === 'signIn' || next === 'signUp')) {
      navigate('/', { replace: true });
      return;
    }
    if (next === 'forgot' && !values.email && values.identifier.includes('@')) {
      setValues(v => ({ ...v, email: v.identifier.trim() }));
    }
    setMode(next);
    setErrors({});
    setFormError(null);
    setFormInfo(null);
    requestAnimationFrame(() => {
      const refFor = { email: emailRef, username: usernameRef, identifier: identifierRef, password: passwordRef };
      const first = FIELDS[next][0];
      (first ? refFor[first].current : titleRef.current)?.focus({ preventScroll: true });
    });
  }

  function startCooldown() {
    const current = Date.now();
    setNow(current);
    setCooldownUntil(current + RESEND_COOLDOWN_S * 1000);
  }

  function handleError(err) {
    setStatus('idle');
    if (err.code === 'invalid_token') {
      goTo('linkInvalid');
    } else if (err.field && FIELDS[mode].includes(err.field)) {
      setErrors({ [err.field]: err.message });
    } else if (err.status === 401) {
      setErrors({});
      setFormError('Invalid email, username, or password.');
    } else {
      setFormError(err.message);
    }
  }

  async function sendResetLink() {
    setStatus('loading');
    setFormError(null);
    setFormInfo(null);
    try {
      await requestPasswordReset(values.email.trim());
      setStatus('idle');
      startCooldown();
      if (mode === 'sent') setFormInfo('We sent another link.');
      else goTo('sent');
    } catch (err) {
      handleError(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status !== 'idle') return;

    if (mode === 'linkInvalid') {
      goTo('forgot');
      return;
    }
    if (mode === 'sent') {
      if (cooldown === 0) sendResetLink();
      return;
    }

    const found = validate(mode, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(null);
      return;
    }

    if (mode === 'forgot') {
      sendResetLink();
      return;
    }

    setStatus('loading');
    setFormError(null);
    try {
      const fields = {
        signUp: { email: values.email.trim(), username: values.username.trim(), password: values.password },
        signIn: { identifier: values.identifier.trim(), password: values.password },
        reset: { token: resetToken, password: values.password },
      }[mode];
      const user = await authenticate(mode, fields);
      setValues(v => ({ ...v, password: '' }));
      setStatus('success');

      const reduced = prefersReducedMotion();
      setTimeout(() => setLeaving(true), reduced ? 0 : 420);
      setTimeout(() => {
        enter(user);
        navigate(location.state?.from || '/', { replace: true });
      }, reduced ? 0 : 700);
    } catch (err) {
      handleError(err);
    }
  }

  const passwordIsNew = mode === 'signUp' || mode === 'reset';
  const subtitle = mode === 'sent'
    ? <>If an account exists for <strong className={styles.sentEmail}>{values.email.trim()}</strong>, a reset link is on its way. It expires in 30 minutes.</>
    : copy.subtitle;
  const submitLabel = mode === 'sent' && cooldown > 0 ? `Resend Link (${cooldown}s)` : copy.submit;

  return (
    <div className={`${styles.page} ${leaving ? styles.leaving : ''}`}>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.glowPrimary} />
        <span className={styles.glowAccent} />
      </div>

      <div className={styles.layout}>
        <section className={styles.intro}>
          <div className={styles.wordmark}>
            <LogoMark className={styles.mark} />
            IronBase
          </div>
          <h1 key={mode} ref={titleRef} tabIndex={-1} className={styles.title}>
            {copy.title.map((line, i) => (
              <span key={line} className={styles.titleLine} style={{ '--i': i }}>{line}</span>
            ))}
          </h1>
          <p key={`${mode}-sub`} className={styles.subtitle} aria-live="polite">{subtitle}</p>
        </section>

        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby="auth-heading">
          <h2 id="auth-heading" className="visually-hidden">{copy.heading}</h2>

          {notice && mode === 'signIn' && (
            <p className={styles.notice} role="status">{notice}</p>
          )}
          {!online && (
            <p className={styles.notice} role="status">You’re offline. Connect to the internet to {OFFLINE_ACTION[mode]}.</p>
          )}

          <div className={styles.fields}>
            <Reveal open={shown.includes('email')}>
              <Field
                inputRef={emailRef}
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={update('email')}
                error={errors.email}
              />
            </Reveal>

            <Reveal open={shown.includes('identifier')}>
              <Field
                inputRef={identifierRef}
                label="Email or username"
                autoComplete="username"
                value={values.identifier}
                onChange={update('identifier')}
                error={errors.identifier}
              />
            </Reveal>

            <Reveal open={shown.includes('username')}>
              <Field
                inputRef={usernameRef}
                label="Username"
                autoComplete="username"
                value={values.username}
                onChange={update('username')}
                error={errors.username}
              />
            </Reveal>

            <Reveal open={shown.includes('password')}>
              <Field
                inputRef={passwordRef}
                label={mode === 'reset' ? 'New password' : 'Password'}
                type={showPassword ? 'text' : 'password'}
                autoComplete={passwordIsNew ? 'new-password' : 'current-password'}
                value={values.password}
                onChange={update('password')}
                error={errors.password}
                hint={passwordIsNew ? 'At least 8 characters.' : undefined}
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
            </Reveal>

            <Reveal open={mode === 'signIn'}>
              <div className={styles.forgotRow}>
                <button type="button" className={styles.forgotLink} onClick={() => goTo('forgot')} disabled={status !== 'idle'}>
                  Forgot password?
                </button>
              </div>
            </Reveal>
          </div>

          <div className={styles.formErrorSlot} aria-live="polite">
            {formError && <p key={formError} className={styles.formError}>{formError}</p>}
            {!formError && formInfo && <p key={formInfo} className={styles.formInfo}>{formInfo}</p>}
          </div>

          <Button
            type="submit"
            variant={mode === 'sent' ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            status={status}
            disabled={mode === 'sent' && cooldown > 0}
          >
            {submitLabel}
          </Button>

          <p className={styles.switch}>
            {copy.switchPrompt && <><span>{copy.switchPrompt}</span>{' '}</>}
            <button type="button" className={styles.switchButton} onClick={() => goTo(copy.switchTo)} disabled={status !== 'idle'}>
              {copy.switchAction}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
