# Security Best Practices for Nmovie Backend

- JWT_SECRET and database credentials must be rotated regularly and never hard-coded.
- How to generate a proper JWT secret:
-   OpenSSL example: openssl rand -base64 32
- How to set strong Postgres credentials:
-   Use a unique, long username and a strong password; avoid default values.
- Environment variables that MUST be changed in production:
-   JWT_SECRET
-   POSTGRES_USER
-   POSTGRES_PASSWORD
-   VITE_TMDB_API_KEY
- Never commit .env files. Use .env.example as a template and ensure production envs are managed securely.
- Note: Do not store secrets in the repository. Use a secure secret manager where possible.

## Secrets rotation guidance
- Rotate JWT_SECRET periodically; invalidate old tokens as needed.
- Use a stand-alone, randomly generated passphrase for database credentials.
- When rotating keys, ensure all services are updated to use new values and perform a minimal downtime rotation.

## Secrets exposure and handling
- Do not log secrets in logs or error messages.
- Consider using environment-specific configurations (development, staging, production).
- Use a .env.example for guidance, but do not commit real secrets.

This document is intended as a concise security hygiene reference for rotating and protecting secrets.
