# Sentinel Journal 🛡️

## 2026-02-03 - Authentication Rate Limiting Gap
**Vulnerability:** Authentication endpoints (`/login`, `/signup`, `/refresh`, `/forgot-password`, etc.) lacked rate limiting, exposing the application to brute-force and credential stuffing attacks.
**Learning:** `slowapi` decorators only execute *after* Pydantic validation. Requests failing validation (422) bypass rate limits, which allows attacking the validation layer itself. Also, `slowapi` requires the `request: Request` argument in the endpoint signature to function; without it, it may fail silently or not track IPs correctly.
**Prevention:** Enforce rate limiting on all auth endpoints using `AUTH_RATE_LIMIT`. Ensure `request: Request` is added to all rate-limited endpoint signatures. Verify rate limiting with tests that pass validation (so the decorator executes).
