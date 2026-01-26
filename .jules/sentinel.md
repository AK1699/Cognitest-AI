## 2025-02-18 - Auth Rate Limiting and Secure Random
**Vulnerability:** Missing rate limiting on sensitive endpoints (`/login`, `/forgot-password`) and weak random number generation (`random.choices`) for password reset codes.
**Learning:** `slowapi` (v0.1.9) requires the `response: Response` parameter in FastAPI endpoint signatures if the endpoint returns a `dict`, otherwise it cannot inject rate limit headers and raises an exception.
**Prevention:** Ensure `response: Response` is included in arguments for all rate-limited endpoints returning JSON dicts. Always use `secrets` for security tokens.
