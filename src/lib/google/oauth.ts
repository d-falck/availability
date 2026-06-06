/**
 * Minimal Google OAuth 2.0 (read-only calendar) over plain fetch — avoids the
 * heavy googleapis SDK. Offline access yields a long-lived refresh token we
 * store per account; access tokens are minted on demand.
 */

const SCOPE = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function redirectUri(): string {
  return `${env("APP_URL").replace(/\/$/, "")}/api/google/callback`;
}

/** URL to send the user to. `state` round-trips through the callback. */
export function authUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent", // force a refresh_token even on re-auth
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Google token error: ${res.status} ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  return tokenRequest({
    code,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
}

// ── Sign-in with Google (identity only — separate redirect from calendar) ──

export function loginRedirectUri(): string {
  return `${env("APP_URL").replace(/\/$/, "")}/api/auth/google/callback`;
}

export function loginUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: loginRedirectUri(),
    response_type: "code",
    scope: "openid email",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeLoginCode(code: string): Promise<TokenResponse> {
  return tokenRequest({
    code,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: loginRedirectUri(),
    grant_type: "authorization_code",
  });
}

export async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const { access_token } = await tokenRequest({
    refresh_token: refreshToken,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });
  return access_token;
}

/** The account email, used as the stable account id. */
export async function fetchEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo error: ${res.status}`);
  return ((await res.json()) as { email: string }).email;
}
