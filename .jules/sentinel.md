## 2024-05-22 - Insecure Random Number Generation in Auth
**Vulnerability:** Weak PRNG (`random.choices`) was used for generating password reset codes, making them predictable.
**Learning:** `random` module should never be used for security tokens.
**Prevention:** Use `secrets` module for all security-sensitive values. Replaced `random` with `secrets` for reset codes and added dummy verification in login to prevent timing attacks.
