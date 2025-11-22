# Auth Schema (babesclub-commerce)

We are reusing the existing `babesclub-commerce` DynamoDB table for authentication data. All auth-related items are isolated via key prefixes so IAM policies can grant tight, prefix-scoped access (e.g., `PK` beginning with `USER#` or `SESSION#`). No GSIs are required; all lookups read by primary key.

## Entity Keys & Attributes

### User Profile Item

- **Partition Key**: `PK = USER#<emailLower>`
- **Sort Key**: `SK = PROFILE`
- **Attributes**:
  - `userId` (UUID or canonical id)
  - `email` (original casing) & `emailLower`
  - `passwordHash`, `passwordSalt`, `hashAlgorithm`
  - `roles` (array or set), `status` (active/suspended)
  - `createdAt`, `updatedAt`, optional `lastLoginAt`
  - `profile` object (display name, wallet, etc.)
- **Notes**: hash with bcrypt/argon in Lambda layer; never return hash/salt to clients. Access pattern is direct GET by email.

### Session Item

- **Partition Key**: `PK = SESSION#<sessionId>`
- **Sort Key**: `SK = METADATA`
- **Attributes**:
  - `userPk` (the matching `USER#...` value)
  - `userId`, `emailLower`, `roles` snapshot for quick authz
  - `issuedAt`, `expiresAt` (also used as DynamoDB TTL)
  - `ip`, `userAgent`, optional `revoked` flag, `reason`
- **Notes**: every login writes a new session row; logout deletes it (or marks `revoked = true`). Authorizer Lambdas read sessions by id to validate bearer tokens.

### Optional Token Items

- **Password reset / email verification** reuse the same prefix:
  - `PK = USER#<emailLower>`
  - `SK = RESET#<token>` or `VERIFY#<token>`
  - Attributes: `expiresAt` (TTL), `createdAt`, `ip`, `userAgent`, `usedAt`.

## Access Patterns (No GSIs)

1. **Login**: `GetItem` on `USER#email` → verify hash → `PutItem` new `SESSION#uuid`.
2. **Auth check**: `GetItem` on `SESSION#token`. Use `userPk` to lazily refresh profile if needed.
3. **Logout**: `DeleteItem` for `SESSION#token` (or update `revoked`).
4. **Reset password**: `PutItem` reset token with TTL; `GetItem` by `SK` during verify.
5. **Session cleanup**: rely on DynamoDB TTL (`expiresAt`) + occasional scan via AWS CLI if needed.

Since we skip GSIs, batch operations ("list all sessions for a user") should be rare. When needed, store a `sessionList` array on the user profile or run an admin-only scan filtered by `begins_with(PK, 'SESSION#') AND userPk = :pk`.

## IAM & Security Guidance

- Auth Lambdas get `dynamodb:*` scoped to `PK = USER#*` and `PK = SESSION#*` via condition expressions where possible.
- Store hashing secrets / pepper in Secrets Manager. Load once per cold start.
- Enforce minimum password requirements before hashing; audit log login failures.
- Use `expiresAt` TTL (e.g., 12 hours) plus an absolute max session age (30 days) to auto-expire tokens.

## Implementation Checklist

1. Extend shared commerce layer with helpers: `hash_password`, `verify_password`, `issue_session`, `revoke_session`.
2. Create `babes-website-auth-login` Lambda (Python 3.12) that reads/writes the entities above.
3. Add `/auth/login` (and `/auth/logout`) routes in API Gateway; wire CORS + env vars for salts/peppers.
4. Update frontend (`src/pages/Login/index.tsx`) to call the login endpoint and store session tokens; add logout handling.
5. Update other Lambdas or a custom authorizer to validate `SESSION#` entries on incoming requests.
