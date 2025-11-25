# Babes Club JWT Migration TODO

This file tracks the migration steps from session-based to JWT authentication for all relevant Lambda functions and infrastructure.

## Migration Checklist

- [ ] Refactor Lambda function code to use JWT authentication
  - [x] babes-website-auth-login: Issue JWT on login
  - [x] babes-website-auth-signup: Issue JWT on signup (if needed)
  - [x] babes-website-auth-authorizer: Verify JWT for protected endpoints
  - [x] babes-website-dashboard-get-profile: Use JWT for user context
  - [x] babes-website-dashboard-update-profile: Use JWT for user context
  - [x] babes-website-dashboard-revoke-session: Remove session logic, use JWT
- [ ] Remove DynamoDB session logic from Lambda functions
- [ ] Test authentication endpoints
  - [ ] Login returns valid JWT accessToken
  - [ ] Protected endpoints accept and verify Bearer tokens
- [ ] Deploy updated Lambda code
- [ ] Validate authentication flow from frontend
- [ ] Clean up legacy sessions from DynamoDB
- [ ] Document migration and update README

---

**Progress Tracking:**

- Mark each item as complete (`[x]`) as you finish.
- Add notes or blockers under each item as needed.
