/** Durée de vie des cookies de session (≈ 400 jours, plafond navigateurs). */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: AUTH_COOKIE_MAX_AGE,
  // En local (http) secure doit rester false ; en prod HTTPS, true.
  secure: process.env.NODE_ENV === "production",
};
