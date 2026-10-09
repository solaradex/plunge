# Password recovery setup

The app's password recovery flow uses Supabase Auth and the following routes:

- `/forgot-password` requests the email.
- `/reset-password` accepts the recovery session and saves the new password.
- `/login` links to the recovery request.

## Supabase dashboard configuration

In **Authentication → URL Configuration**:

1. Set **Site URL** to the deployed Plunge origin.
2. Add the exact deployed origin plus `/reset-password` to **Redirect URLs**.
3. For local development, also allow `http://localhost:3000/reset-password`.
4. Do not use a wildcard redirect for production.

Use the same deployed origin that users visit. The request page constructs the redirect from `window.location.origin`, so the allowed redirect must match that origin exactly.

## Verification checklist

- Request a reset for a registered email and confirm the response does not reveal whether the account exists.
- Open the newest email link and confirm it lands on `/reset-password`.
- Confirm an expired or already-used link displays a safe error and lets the user request another link.
- Confirm mismatched entries and passwords shorter than eight characters are rejected.
- Confirm a valid update succeeds and the user can sign in with the new credential.
- Verify both local and deployed redirect URLs in the Supabase dashboard before launch.
