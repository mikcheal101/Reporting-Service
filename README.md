# Alcestis Reporting — Backend (NestJS)

A modular NestJS backend for:

- Authentication & user management (JWT via httpOnly cookies)
- Secure database connections (AES-256-CBC encrypted at rest)
- Building and managing reports
- Scheduling automated report execution (cron)
- Exporting data (CSV, Excel, PDF, JSON, TXT, Word)
- Email delivery with attachments
- File storage & download support
- SOX-compliant audit trail (global AuditInterceptor)
- RBAC permission guard on all API routes
- Compliance reporting (PCI-DSS, SOX, GDPR, SOC2)
- Data retention policies (auto-purge audit logs)
- Sensitive data masking (SSN, credit card, credentials, tokens)

## Key features

| Feature | Status |
|---|---|
| Multi-database support (9 DB types) | Done |
| JWT auth with httpOnly cookies | Done |
| Role-based access control | Done |
| AES-256 encryption for credentials | Done |
| Global SOX-compliant audit logging | Done |
| SQL injection prevention | Done |
| AI-powered query generation (Ollama) | Done |
| Scheduled report execution | Done |
| Report export (CSV, Excel, PDF, JSON, TXT, Word) | Done |
| Email delivery with attachments | Done |
| Dashboard metrics & AI insights | Done |
| Health checks, metrics, tracing | Done |
| Circuit breaker, connection pool monitoring | Done |
| **Compliance reporting (PCI-DSS, SOX, GDPR, SOC2)** | **New** |
| **Data retention purge** | **New** |
| **Permission guard on all routes** | **New** |
| **Data masking in report exports** | **New** |

## Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `DB_*` | Database connection (MSSQL) |
| `HASHING_ROUNDS` | bcrypt rounds (10) |
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | AES-256 key (32 chars) |
| `AUDIT_LOG_RETENTION_DAYS` | Days before audit logs are purged (default 365) |
| `COMPLIANCE_AUDIT_SCHEDULE` | Cron for compliance audit schedule |
| `DATA_RETENTION_PURGE_SCHEDULE` | Cron for data retention purge |
| `FRONTEND_URL` | CORS origin |

## API endpoints

### Auth
- `POST /api/v1/auth/login` — sign in
- `POST /api/v1/auth/register` — sign up
- `POST /api/v1/auth/logout` — sign out
- `GET /api/v1/auth/profile` — current user profile

### Users
- `GET/POST /api/v1/users` — list / create users
- `GET/PUT/DELETE /api/v1/users/:id` — CRUD
- `POST /api/v1/users/:id/change-password` — change password
- `POST /api/v1/users/assign-role` — assign roles
- `POST /api/v1/users/assign-permission` — assign permissions

### Connections
- `GET/POST /api/v1/connections` — list / create connections
- `GET/PUT/DELETE /api/v1/connections/:id` — CRUD
- `POST /api/v1/connections/test-connection` — test connection
- `GET /api/v1/connections/:id/tables` — fetch tables

### Reports
- `GET/POST /api/v1/reports` — list / create reports
- `GET/PUT/DELETE /api/v1/reports/:id` — CRUD
- `POST /api/v1/reports/test-query` — test query (masked)
- `POST /api/v1/reports/save-query` — save query
- `POST /api/v1/reports/ai-generate-query` — AI query generation

### Tasks (Scheduling)
- `POST /api/v1/tasks` — schedule task
- `GET /api/v1/tasks/pending-tasks` — pending tasks
- `GET /api/v1/tasks/completed-tasks` — completed tasks
- `GET /api/v1/tasks/download-report/:id` — download report export

### Audit Logs
- `GET /api/v1/audit-logs` — paginated, filterable
- `GET /api/v1/audit-logs/:id` — single entry
- `DELETE /api/v1/audit-logs/purge` — purge old logs (admin)

### Compliance
- `GET /api/v1/compliance/check` — run compliance check
- `POST /api/v1/compliance/report` — generate compliance report
- `GET /api/v1/compliance/report` — latest report

### Dashboard
- `GET /api/v1/dashboard/metrics` — report stats
- `GET /api/v1/dashboard/insights` — AI insights

### Other
- `GET /api/v1/roles` — manage roles
- `GET /api/v1/permissions` — list permissions
- `GET /api/v1/report-types` — manage report types
- `GET /api/v1/health` — health check

## Permission model

All API routes are protected by `AuthGuard` + `PermissionGuard` (registered globally).
Each endpoint requires a specific permission (e.g., `connection.view`, `report.create`, `audit-log.delete`).
The `super-admin` role has all permissions. Other roles must be assigned via the admin UI.

## Data retention

Audit logs can be purged via:
```
DELETE /api/v1/audit-logs/purge?days=365
```
Configure `AUDIT_LOG_RETENTION_DAYS` in `.env`. Default is 365 days.

## Compliance

The compliance module runs automated checks against 4 standards:
- **PCI-DSS**: encryption, access control, audit trail, cardholder data masking
- **SOX**: audit trail, segregation of duties, data integrity, change management
- **GDPR**: data minimization, right to access, data portability, consent management
- **SOC2**: security, availability, processing integrity, confidentiality, privacy

Generate a compliance report:
```
POST /api/v1/compliance/report
```
