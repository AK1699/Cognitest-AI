## 2026-02-05 - Rate Limiting Implementation Gaps
**Vulnerability:** Authentication endpoints were documented as rate-limited but lacked implementation code, leaving them exposed to brute-force attacks.
**Learning:** Documentation and memory/knowledge bases can diverge from code reality. Implementation of security controls like `slowapi` requires explicit decoration of endpoints and passing `request` objects, which can be missed during rapid development or refactoring.
**Prevention:** Verify security controls by checking the code (decorators) and running reproduction tests that specifically attempt to bypass the control (e.g., sending >limit requests).
