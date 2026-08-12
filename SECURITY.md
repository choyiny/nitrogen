# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub's **[Security Advisories](https://github.com/choyiny/nitrogen/security/advisories/new)**
("Report a vulnerability"). We'll acknowledge the report, investigate, and coordinate a fix
and disclosure with you.

## Scope

nitrogen is a fully client-side app with no backend. The most sensitive surface is that a
**shared link (`#s=…`) carries an untrusted, attacker-controllable session** that is decoded
and rendered. Assistant markdown is sanitized with DOMPurify before rendering to prevent XSS;
reports of ways to bypass that sanitization, or of any other way a crafted link can execute
script or exfiltrate data, are especially welcome.

## Supported versions

This is a rolling project — fixes land on `main`. There are no separately-maintained releases.
