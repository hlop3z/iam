# Zitadel Apps

## Redirect URIs

Example:

```text
http://localhost:3000/api/auth/callback/zitadel
```

This is the URL that receives the user **after a successful login**.

Typical flow:

```text
1. User clicks "Sign in"
2. Your app redirects to ZITADEL
3. User authenticates
4. ZITADEL redirects back to:
   /api/auth/callback/zitadel
5. Your app exchanges the authorization code for tokens
6. User becomes logged in
```

If you're using something like Auth.js/NextAuth, the callback route is often:

```text
http://localhost:3000/api/auth/callback/zitadel
```

ZITADEL will reject redirects to URLs that are not listed here.

---

## Post Logout URIs

Example:

```text
http://localhost:3000/api/auth/logout/callback
```

This is where ZITADEL redirects the user **after logout**.

Typical flow:

```text
1. User clicks "Logout"
2. Your app redirects to ZITADEL logout endpoint
3. ZITADEL clears its session
4. ZITADEL redirects back to:
   /api/auth/logout/callback
5. Your app clears local session/cookies
6. User sees logged-out state
```

Again, ZITADEL only allows redirects to URLs listed in the Post Logout URIs.

---

## Development vs Production

For local development:

```text
http://localhost:3000/api/auth/callback/zitadel
http://localhost:3000/api/auth/logout/callback
```

are fine because Dev Mode is enabled.

For production, you would use HTTPS:

```text
https://app.example.com/api/auth/callback/zitadel
https://app.example.com/api/auth/logout/callback
```

---

## If you're building your own backend

You don't have to use `/api/auth/callback/zitadel`.

You can use any endpoint, for example:

```text
https://api.example.com/auth/callback
https://api.example.com/auth/logout
```

as long as:

1. Your application actually serves those endpoints.
2. The URLs are registered in ZITADEL.

---

## Quick rule

- **Redirect URI** = "Where should ZITADEL send the user after login?"
- **Post Logout URI** = "Where should ZITADEL send the user after logout?"

The values must exactly match the URLs your application uses for those authentication callbacks.
