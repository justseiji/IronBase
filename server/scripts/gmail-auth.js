// One-time helper: signs in to the Gmail account that sends IronBase's emails
// and prints the refresh token for GMAIL_REFRESH_TOKEN.
// Run from server/:  npm run gmail-auth   (reads GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET from .env)
import http from 'node:http';
import crypto from 'node:crypto';

const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret, GMAIL_USER } = process.env;
if (!clientId || !clientSecret) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (for example in server/.env) first.');
  process.exit(1);
}

const PORT = 53682;
const redirectUri = `http://127.0.0.1:${PORT}/oauth2callback`;
const state = crypto.randomBytes(16).toString('hex');
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/gmail.send',
  access_type: 'offline',
  prompt: 'consent',
  state,
  code_challenge: challenge,
  code_challenge_method: 'S256',
  ...(GMAIL_USER ? { login_hint: GMAIL_USER } : {}),
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const finish = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<p style="font-family: sans-serif; padding: 2rem;">${message}</p>`);
    server.close();
  };

  if (url.searchParams.get('state') !== state) return finish(400, 'State mismatch. Run the script again.');
  if (url.searchParams.get('error')) {
    console.error('Google returned an error:', url.searchParams.get('error'));
    return finish(400, 'Authorization was not completed. You can close this tab.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: url.searchParams.get('code'),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  const data = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !data.refresh_token) {
    console.error('Token exchange failed:', data.error || tokenRes.status, data.error_description || '');
    return finish(500, 'Token exchange failed. See the terminal for details.');
  }

  console.log('\nGMAIL_REFRESH_TOKEN=' + data.refresh_token + '\n');
  finish(200, 'IronBase can now send email from this account. You can close this tab.');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this URL, sign in as the IronBase sending account, and approve:\n');
  console.log(authUrl + '\n');
});
