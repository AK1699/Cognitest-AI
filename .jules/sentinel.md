## 2025-02-18 - Rate Limiting Implementation Patterns
**Vulnerability:** Missing rate limiting on authentication endpoints exposed the application to brute-force attacks.
**Learning:** When implementing `slowapi` rate limiting in FastAPI, the `request: Request` parameter is mandatory in the endpoint signature. However, some endpoints already used `request` as the argument name for Pydantic models (e.g., `request: ForgotPasswordRequest`). This creates a conflict.
**Prevention:** When adding rate limiting, always check for argument name conflicts. The standard pattern adopted is to rename the Pydantic model argument to `body` and add `request: Request` as the first argument.

## 2025-02-18 - Test Environment Dependency Conflicts
**Vulnerability:** Unit tests failed due to Pydantic v1/v2 conflicts within `langchain` dependencies (`TypeError: ForwardRef._evaluate()`).
**Learning:** The codebase has a known issue where importing `app.main` or `app.api.v1` triggers these conflicts if `langchain` modules are loaded.
**Prevention:** Tests must mock `app.services.ai_service`, `langchain_openai`, `langsmith`, and `langchain_core` modules *before* importing the application to bypass these runtime errors during testing.
