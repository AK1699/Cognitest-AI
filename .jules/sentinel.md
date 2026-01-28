## 2025-05-18 - SlowAPI Argument Naming Conflict
**Vulnerability:** Missing rate limiting on sensitive authentication endpoints.
**Learning:** When using `slowapi` with FastAPI, endpoints must include a `request: Request` parameter. If the endpoint already has a Pydantic model argument named `request`, this creates a conflict. FastAPI tries to inject the request object into the Pydantic model or vice versa, leading to errors.
**Prevention:** Always check for argument naming conflicts when adding `request: Request` for rate limiting. Rename Pydantic model arguments to `body` or `data` if they are named `request`.
