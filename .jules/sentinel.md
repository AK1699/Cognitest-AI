# Sentinel Journal

## 2026-01-22 - [HIGH] Weak Random Number Generator in Password Reset
**Vulnerability:** Usage of `random.choices` for generating password reset codes. `random` is not cryptographically secure and can be predictable.
**Learning:** Developers often default to `random` for all randomness needs. Security-sensitive tokens must use `secrets` module.
**Prevention:** Use `secrets` module for all security-related randomness (tokens, passwords, keys). Add linter rules to flag `random` usage in auth-related files.
