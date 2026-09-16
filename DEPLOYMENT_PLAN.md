# FieldTrack Pro Deployment Plan

## 1. Objective

Deploy FieldTrack Pro as a secure, recoverable production service with HTTPS, persistent data, monitoring, backups, and a repeatable release process.

The target architecture is provider-neutral and can run on a managed container platform, managed Node.js service, or Linux VPS.

## 2. Current-state summary

- Frontend: React 19 and Vite
- Backend: Node.js and Express
- Build output: `dist/`
- Current data store: `data/database.json`
- Default application port: `3000`; use `3001` where port `3000` is occupied
- PWA features: service worker and web manifest
- Device features: browser geolocation and camera
- External map services: CARTO, Mapbox, or Google tiles

The application builds successfully, but its current authentication, authorization, password storage, and JSON persistence should be remediated before an internet-facing release.

## 3. Release gates

Production deployment must not proceed until all critical gates are complete.

### Critical security gates

- Hash passwords with Argon2id or bcrypt; never store plaintext passwords.
- Remove hard-coded default administrator and staff passwords.
- Require authentication on every non-public API route.
- Enforce role-based authorization for administrative, manager, and staff actions.
- Protect password reset, backup, restore, system reset, user management, payroll, and settings endpoints.
- Add login throttling and general API rate limiting.
- Add secure HTTP headers using Helmet or an equivalent mechanism.
- Restrict CORS to the production origin.
- Validate and sanitize all API input.
- Set request-size limits appropriate for photo uploads.
- Ensure errors do not expose secrets, filesystem paths, or stack traces.
- Run a dependency vulnerability scan and resolve critical/high findings.

### Data and reliability gates

- Select a production database. PostgreSQL is recommended.
- Migrate users, sessions, visits, locations, alerts, tasks, rosters, leave records, settings, and master data from JSON storage.
- Store photos in object storage rather than embedding large payloads in the database.
- Add database migrations and a tested rollback procedure.
- Implement automated database and object-storage backups.
- Test restoration into a clean environment.
- Add graceful shutdown handling for deployment restarts.

### Application gates

- Correct the production start command and module entry point.
- Add automated API, authorization, and critical UI-flow tests.
- Add structured application logging.
- Add readiness and liveness endpoints.
- Confirm service-worker caching does not retain outdated or sensitive responses.
- Reduce or accept the documented frontend bundle-size warning.

## 4. Target architecture

```text
Users on mobile/desktop
          |
       HTTPS
          |
CDN/WAF or reverse proxy
          |
FieldTrack Pro Node.js service
       |             |
   PostgreSQL    Object storage
          |
 Backup and monitoring services
```

### Production components

1. One or more Node.js application instances.
2. Managed PostgreSQL database.
3. S3-compatible, Azure Blob, or equivalent object storage for photos.
4. Reverse proxy or managed ingress with TLS termination.
5. Secret manager for database credentials, signing keys, and external API keys.
6. Centralized logs, metrics, uptime checks, and alerts.
7. Automated build and deployment pipeline.

Start with one application instance. Enable multiple instances only after replacing JSON persistence and confirming sessions do not depend on local process memory.

## 5. Environment strategy

Maintain separate environments:

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | Development and manual testing | Synthetic only |
| Staging | Release validation and acceptance testing | Sanitized or synthetic |
| Production | Live workforce operations | Production data |

Use separate databases, storage containers, credentials, domains, and API keys for each environment.

## 6. Required production configuration

The exact variable names should be finalized during the security and database work. Expected configuration includes:

```env
NODE_ENV=production
PORT=3001
APP_URL=https://fieldtrack.example.com
DATABASE_URL=postgresql://...
SESSION_SECRET=...
PASSWORD_PEPPER=...
OBJECT_STORAGE_ENDPOINT=...
OBJECT_STORAGE_BUCKET=...
OBJECT_STORAGE_ACCESS_KEY=...
OBJECT_STORAGE_SECRET_KEY=...
MAPBOX_ACCESS_TOKEN=...
```

Requirements:

- Generate secrets with a cryptographically secure generator.
- Store secrets in the platform secret manager.
- Never commit production `.env` files.
- Rotate secrets on a defined schedule and after any suspected exposure.

## 7. Implementation phases

### Phase 1: Harden the application

1. Introduce password hashing and migrate existing credentials safely.
2. Implement authenticated server-side sessions or signed short-lived access tokens with secure refresh handling.
3. Add authorization middleware and route-level permissions.
4. Protect sensitive system operations with additional confirmation and audit logging.
5. Add validation, rate limiting, Helmet, restricted CORS, and safe error responses.
6. Remove defaults that expose usable credentials.
7. Add tests for login, logout, password reset, roles, and unauthorized access.

Exit criteria: all security tests pass and no sensitive route is anonymously accessible.

### Phase 2: Replace local persistence

1. Design the PostgreSQL schema and migration history.
2. Add a database access layer with transactions.
3. Create a one-time JSON-to-PostgreSQL migration command.
4. Move photo binaries to object storage and retain references in PostgreSQL.
5. Verify record counts and representative records after migration.
6. Test backup and restore.

Exit criteria: the application runs without writing operational data to `data/database.json`.

### Phase 3: Package the application

1. Add a multi-stage production Dockerfile.
2. Run the service as a non-root user.
3. Include only production dependencies and compiled output in the runtime image.
4. Add container health checks.
5. Pin the Node.js major version.
6. Build and scan the container image.

Exit criteria: the image starts from an empty host and passes health and smoke tests.

### Phase 4: Provision staging

1. Create network, compute, PostgreSQL, object storage, secret manager, and logging resources.
2. Configure a staging domain and valid TLS certificate.
3. Restrict direct database and application-port access.
4. Deploy the image and apply database migrations.
5. Seed synthetic test accounts and data.

Exit criteria: staging is available exclusively over HTTPS and all dependencies are healthy.

### Phase 5: Validate staging

Test on both desktop and real mobile devices:

- First-time organization setup
- Administrator, manager, and staff authentication
- Invalid login and account isolation
- Staff registration and role changes
- Camera permission and photo capture
- GPS permission, check-in, tracking, and check-out
- Geofence validation
- Offline operation and later synchronization
- Visit creation and manager verification
- Leave, roster, attendance, payroll, and report workflows
- PWA installation and upgrade behavior
- Backup and restore
- Session expiry and logout
- Permission-denied and network-failure handling

Also perform load, security, accessibility, and browser-compatibility testing.

Exit criteria: acceptance tests pass with no unresolved critical or high-severity defects.

### Phase 6: Production rollout

1. Schedule a deployment window and name the release owner.
2. Confirm the latest backup and restoration test.
3. Provision production resources independently of staging.
4. Configure DNS with a low TTL before cutover.
5. Deploy the approved immutable image.
6. Apply database migrations.
7. Run automated smoke tests against the production URL.
8. Create the initial administrator through a controlled one-time process.
9. Increase DNS traffic or enable the public route.
10. Monitor errors, latency, resource usage, authentication failures, and synchronization failures.

Exit criteria: production smoke tests pass and monitoring remains healthy through the observation window.

## 8. CI/CD pipeline

Every change should run:

```text
Install with npm ci
TypeScript validation
Unit and integration tests
Production build
Dependency and secret scanning
Container build and image scan
Deploy to staging
Database migration check
Staging smoke tests
Manual production approval
Production deployment
Production smoke tests
```

Deploy immutable, version-tagged artifacts. Do not rebuild a release separately for production.

## 9. Monitoring and alerts

Capture at minimum:

- Request rate, latency, and HTTP error rate
- Process restarts, CPU, memory, and disk usage
- Database availability, connections, storage, and slow queries
- Failed logins, password resets, and access-denied events
- GPS synchronization failures and queued offline records
- Object-storage upload failures
- Backup success and backup age
- TLS certificate expiration
- External map-provider failures or quota exhaustion

Do not log passwords, tokens, precise GPS payloads unnecessarily, or photo contents. Define retention and access controls for location and attendance logs.

## 10. Backup and recovery

- Run automated encrypted database backups daily, with point-in-time recovery where supported.
- Enable object-storage versioning or lifecycle-protected backups.
- Store backups in a separate failure domain or account.
- Define retention based on business and legal requirements.
- Test restoration at least quarterly.
- Document recovery time objective (RTO) and recovery point objective (RPO).

Initial targets:

- RPO: 24 hours or better
- RTO: 4 hours or better

Adjust these targets with business owners before launch.

## 11. Rollback plan

Trigger rollback for failed health checks, elevated server errors, authentication failures, corrupted migrations, or critical workflow failures.

1. Stop routing new traffic to the failed release.
2. Redeploy the previous known-good image.
3. Roll back the database only when the migration provides a tested safe downgrade.
4. Otherwise restore from backup into a new database and validate it before switching.
5. Verify login, check-in, synchronization, and manager-dashboard workflows.
6. Record the incident and block redeployment until the cause is understood.

Never restore `database.json` over a running multi-instance deployment.

## 12. Ownership checklist

Assign a named owner for:

- Application security
- Database and migrations
- Infrastructure and networking
- CI/CD
- Monitoring and incident response
- Backups and restoration
- Privacy, GPS-data retention, and employee consent
- Release approval

## 13. Go-live checklist

- [ ] Critical security gates completed
- [ ] Production database and object storage configured
- [ ] HTTPS and production domain working
- [ ] Secrets stored outside source control
- [ ] Backups enabled and restoration tested
- [ ] Monitoring dashboards and alerts active
- [ ] Staging acceptance tests approved
- [ ] Mobile GPS and camera tested over HTTPS
- [ ] Privacy policy, consent, and retention requirements approved
- [ ] Rollback tested
- [ ] Production smoke test prepared
- [ ] Support and incident contacts documented

## 14. Immediate next actions

1. Choose the hosting provider and region.
2. Confirm expected user count, GPS update volume, photo volume, and retention period.
3. Select PostgreSQL and object-storage services.
4. Complete the security remediation before public exposure.
5. Create staging infrastructure and automate deployment.
6. Run acceptance testing, then schedule production cutover.
