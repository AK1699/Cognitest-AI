## 2026-01-25 - Login Timing Attack Prevention
**Vulnerability:** User enumeration via timing attack in `login` endpoint. Response time differed significantly between invalid email and invalid password because `bcrypt` verification was skipped when user was not found.
**Learning:** `bcrypt` verification is computationally expensive. Skipping it when user is not found leaks information about the existence of the email address.
**Prevention:** Implemented constant-time verification path. If user is not found, verify a pre-calculated dummy hash against the provided password.
