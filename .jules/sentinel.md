## 2024-05-23 - FastAPI/Slowapi Request Argument Conflict
**Vulnerability:** Rate limiting bypass or 500 errors.
**Learning:** `slowapi` requires `request: Request` in the endpoint signature. However, if an endpoint uses a Pydantic model argument named `request` (e.g. `forgot_password(request: ForgotPasswordRequest)`), adding `request: Request` creates a conflict or shadows the Pydantic model, breaking the endpoint logic or the rate limiter.
**Prevention:** Always rename Pydantic model arguments to `body`, `payload`, or specific names (e.g. `user_data`) when adding `request: Request` for rate limiting.
