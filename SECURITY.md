# Security Policy

We take the security of **Aerisyn** seriously. This document describes our security reporting procedure and general guidance.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please do not disclose it publicly. Instead, report it directly to the project maintainers:

1. Send an email to the contact address on the profile page.
2. Provide a clear description of the vulnerability, including step-by-step instructions to reproduce it.
3. Allow the maintainers time to investigate and resolve the issue before disclosure.

We will acknowledge receipt of your report within 48 hours and work with you to fix the issue.

---

## Supported Versions

Only the latest release version on the `main` branch is actively supported with security updates.

---

## Best Practices

- **API Keys**: Never commit your `GEMINI_API_KEY` to public repositories. Always load keys using environment variables.
- **Database Credentials**: Use strong passwords in `DATABASE_URL` settings. Avoid using default credentials in production environments.
- **Dependencies**: Keep your packages up-to-date and run `pnpm audit` regularly to check for known security issues.
