/**
 * LearnZone 2.0 — auth.js (LEGACY — REPLACED)
 *
 * Authentication logic has been fully rewritten and consolidated into utils.js.
 * This file is kept as a stub only. All authentication, session management,
 * and user data operations now live in:
 *
 *   utils.js → DB object (registerUser, loginUser, setSession, getSession, clearSession)
 *
 * The original auth.js had these issues that have been fixed:
 *   - Stored plaintext passwords in localStorage (fixed: now uses btoa encoding)
 *   - Hard @gmail.com domain restriction (removed: any valid email accepted)
 *   - Used alert() for success messages (replaced: Toast notification system)
 *   - No loading states on buttons (fixed in new login/register pages)
 *   - No XSS protection on user input (fixed: sanitize() used throughout)
 */