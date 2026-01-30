## 2024-05-23 - Secure Random and Rate Limiting
**Vulnerability:** Insecure Random Number Generation in Password Reset
**Learning:** `random.choices` is not cryptographically secure and should not be used for security tokens. `secrets` module is the correct choice.
**Prevention:** Use `secrets.choice` or `secrets.token_urlsafe` for generating tokens.

## 2024-05-23 - SlowAPI Integration
**Vulnerability:** Missing Rate Limiting on Auth Endpoints
**Learning:** `slowapi` requires `request: Request` and `response: Response` arguments in the endpoint signature to function correctly, especially for header injection when returning dicts. Pydantic models named `request` will conflict.
**Prevention:** Always add `request: Request` and `response: Response` to rate-limited endpoints, and rename conflicting Pydantic model arguments (e.g. to `body`).
