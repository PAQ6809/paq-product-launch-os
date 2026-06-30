# Developer Role / Admin Safety

PAQ Product Launch OS uses a server-side role model for developer tooling. The browser may display a role badge, but it never decides whether a user is a developer.

## Why Not Password-Based Developer Checks

Developer access must never be based on a password value in code, env vars, README files, tests, or frontend logic. Passwords are authentication secrets, not authorization rules. Role assignment must live in the database or a server-side admin operation where it can be audited and revoked.

## Why Not Frontend-Hardcoded Roles

Client components can be inspected and modified by users. A frontend-only role check can hide or show links, but it cannot protect data or server routes. Developer pages must check the Supabase session and `public.profiles.role` on the server before rendering diagnostics.

## Profiles Role Schema

`public.profiles.role` supports only:

- `user`
- `developer`
- `admin`

The schema in `docs/supabase-schema.sql` enables RLS and grants authenticated users only:

- select access to their own profile
- update access to their own `display_name`, `avatar_url`, and `updated_at`

Authenticated clients do not receive insert, delete, or full-table update privileges for `public.profiles`, and they do not receive update privilege on `role`.

## Grant Developer Role By Email

Run this in the Supabase SQL Editor after the user has signed up:

```sql
update public.profiles
set role = 'developer',
    updated_at = now()
where email = '<YOUR_EMAIL>';
```

## Revoke Developer Role

```sql
update public.profiles
set role = 'user',
    updated_at = now()
where email = '<YOUR_EMAIL>';
```

## Create A Missing Profile And Grant Developer

If the user exists in `auth.users` but does not yet have a profile:

```sql
insert into public.profiles (id, email, display_name, role, created_at, updated_at)
select id, email, 'PAQ', 'developer', now(), now()
from auth.users
where email = '<YOUR_EMAIL>'
on conflict (id) do update
set role = 'developer',
    display_name = coalesce(public.profiles.display_name, 'PAQ'),
    updated_at = now();
```

## Developer Console Safety

The Developer Console may show:

- current account email
- role
- provider names such as `AI_PROVIDER` and `HELP_AI_PROVIDER`
- public AI enablement booleans
- whether OpenAI or NVIDIA keys are configured as `true` / `false`
- rate limit settings
- i18n check status
- references to build, visual test, and safety docs

It must never show:

- OpenAI API key value
- NVIDIA API key value
- Supabase service role key
- encryption master key
- raw environment dumps
- raw auth tokens or cookies

## Demo Mode

When Supabase environment variables are not configured in local development, `/dev` renders Demo Developer Mode with mock diagnostics. This does not mean a real developer account exists.

Demo Developer Mode is development-only. In production, `/dev`, `/dev/ai-diagnostics`, and `/dev/help-diagnostics` fail closed if Supabase is not configured, even when diagnostics are otherwise enabled.

Formal developer access requires:

1. Supabase env vars configured.
2. A signed-in Supabase user.
3. `public.profiles.role` set to `developer` or `admin`.

## Production Dev Console Guard

Production developer routes require both:

1. `ENABLE_DEV_DIAGNOSTICS=true`
2. The signed-in user's `public.profiles.role` is `developer` or `admin`

If `NODE_ENV=production` and `ENABLE_DEV_DIAGNOSTICS` is not exactly `true`, developer routes return 404 and do not render diagnostics metadata.

If `NODE_ENV=production` and `ENABLE_DEV_DIAGNOSTICS=true`, the route still calls the server-side `requireDeveloper()` guard. The env flag only allows the route to be considered; it does not grant developer access.

If Supabase env vars are missing in production, developer routes return 404. They do not fall back to Demo Developer Mode.

## Production Notes

- Keep real AI disabled in public production demos unless intentionally running a closed test.
- Keep `ENABLE_PUBLIC_REAL_AI=false` and `ENABLE_PUBLIC_HELP_AI=false` for public demos.
- Keep `ENABLE_DEV_DIAGNOSTICS=false` for public demos unless running a closed developer test.
- Do not expose service role keys to the browser.
- Use Supabase RLS policies and column grants to prevent client-side role changes.
- Prefer audited SQL/admin workflows for role changes until a dedicated admin backend exists.
