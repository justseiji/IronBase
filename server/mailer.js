import nodemailer from 'nodemailer';

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

const transport = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
  : null;

if (IS_PRODUCTION && !transport) {
  console.error('[IronBase API] GMAIL_USER / GMAIL_APP_PASSWORD are not set; password reset emails cannot be sent.');
}
if (IS_PRODUCTION && !process.env.APP_URL) {
  console.error('[IronBase API] APP_URL is not set; password reset links would point to localhost.');
}

export function passwordResetLink(token) {
  // The token rides in the fragment, which browsers never send to servers, so it stays out of access logs.
  return `${APP_URL}/auth#reset=${token}`;
}

export async function sendPasswordResetEmail(to, link) {
  if (!transport) {
    // Local development without Gmail credentials: surface the link in the server console instead.
    if (!IS_PRODUCTION) console.log(`[IronBase API] Password reset link for ${to}: ${link}`);
    return;
  }

  await transport.sendMail({
    from: `IronBase <${GMAIL_USER}>`,
    to,
    subject: 'Reset your IronBase password',
    text: [
      'Someone asked to reset the password for your IronBase account.',
      '',
      `Choose a new password here (the link expires in 30 minutes and works once):`,
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
  });
}
