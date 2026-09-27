import crypto from 'node:crypto';

// Sends through the Gmail API over HTTPS rather than SMTP: hosts such as
// Render's free tier block outbound mail ports, but not port 443.
const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const CONFIGURED = Boolean(GMAIL_USER && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);

if (IS_PRODUCTION && !CONFIGURED) {
  console.error('[IronBase API] GMAIL_USER / GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN are not all set; password reset emails cannot be sent.');
}
if (IS_PRODUCTION && !process.env.APP_URL) {
  console.error('[IronBase API] APP_URL is not set; password reset links would point to localhost.');
}

let accessToken = null;

async function getAccessToken() {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000) return accessToken.value;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint = data.error === 'invalid_grant'
      ? ' The refresh token was revoked or expired; run `npm run gmail-auth` in server/ to create a new one.'
      : '';
    throw new Error(`Google token refresh failed (${res.status} ${data.error || ''}).${hint}`);
  }
  accessToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return accessToken.value;
}

function base64Lines(text) {
  return Buffer.from(text, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
}

function buildMessage({ to, subject, text, html }) {
  const boundary = `ironbase-${crypto.randomBytes(12).toString('hex')}`;
  return [
    `From: IronBase <${GMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export function passwordResetLink(token) {
  // The token rides in the fragment, which browsers never send to servers, so it stays out of access logs.
  return `${APP_URL}/auth#reset=${token}`;
}

export async function sendPasswordResetEmail(to, link) {
  if (!CONFIGURED) {
    // Local development without Gmail credentials: surface the link in the server console instead.
    if (!IS_PRODUCTION) console.log(`[IronBase API] Password reset link for ${to}: ${link}`);
    return;
  }

  const raw = Buffer.from(buildMessage({
    to,
    subject: 'Reset your IronBase password',
    text: [
      'Someone asked to reset the password for your IronBase account.',
      '',
      'Choose a new password here (the link expires in 30 minutes and works once):',
      link,
      '',
      "If this wasn't you, ignore this email. Your password won't change.",
    ].join('\n'),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1A1D20;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Reset your IronBase password</p>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">Someone asked to reset the password for your IronBase account. The link below expires in 30 minutes and works once.</p>
        <p style="margin: 0 0 24px;">
          <a href="${link}" style="display: inline-block; background: #7F1D1D; color: #EEE8DF; text-decoration: none; font-weight: 600; padding: 12px 22px; border-radius: 10px;">Choose a new password</a>
        </p>
        <p style="font-size: 13px; line-height: 1.5; color: #5f6368; margin: 0;">If this wasn't you, ignore this email. Your password won't change.</p>
      </div>`,
  }), 'utf8').toString('base64url');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`Gmail API send failed (${res.status}): ${detail}`);
  }
}
