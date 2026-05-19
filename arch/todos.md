# Alcestis Reporting — Feature Roadmap

## Phase 1: Multi-Database Parity
- [x] Add PostgreSQL adapter
- [x] Add MariaDB adapter (via mysql2)
- [x] Add Oracle adapter
- [x] Add IBM Db2 adapter
- [x] Add Firebird adapter
- [x] Add H2Database adapter (pg-compat mode)
- [x] Update DatabaseFactory with all 9 types
- [x] 590/590 tests passing

## Phase 2: Security & Hardening
- [x] Helmet middleware
- [x] Rate limiting (60 req/min)
- [x] Input validation (ValidationPipe)
- [x] CORS hardening
- [x] Encrypt connection credentials at rest (AES-256) — `ENCRYPTION_KEY` in .env, CryptoService exists
- [x] SOX-compliant audit logging — global AuditInterceptor auto-logs all POST/PUT/PATCH/DELETE across every entity
- [x] Audit log viewer UI at `/settings/audit-logs` with entity/action/date filters and pagination
- [x] Audit permissions (`audit-log.view`, `audit-log.list`) added to seed
- [x] Row-level security — `userId` column on Connection/Report entities, services filter by `request.user.id`
- [x] SQL injection prevention — `QueryValidatorUtils` blocks DROP/DELETE/INSERT/UPDATE/ALTER/TRUNCATE/CREATE/EXEC/UNION/WAITFOR
- [x] Secrets management — JWT secret moved to `.env` (no longer hardcoded)
- [x] TypeORM migrations — `synchronize: false`, `migrationsRun: true`, `src/database/migrations/InitialSchema.ts` generated
- [x] Password change endpoint — `POST /api/v1/users/:id/change-password` with bcrypt + DTO validation
- [x] `.env.example` created for both backend and frontend documenting all required vars

## Phase 3: Observability & Reliability
- [x] Health check endpoint (`GET /api/v1/health`)
- [x] Structured logging (JSON format via pino-http + pino-pretty)
- [x] OpenTelemetry tracing
- [x] Metrics endpoint (Prometheus)
- [x] Graceful shutdown handler
- [x] Database connection pool monitoring
- [x] Circuit breaker for external DB connections
- [x] Error tracking integration (Sentry)

## Phase 4: Reporting Engine
- [x] Scheduled report execution with cron
- [x] Report export: PDF, XLSX, CSV
- [x] Email delivery of reports
- [x] Report templates with parameterized queries
- [x] Report execution history with logs
- [x] Query timeout per data source — configurable per-connection (`queryTimeout` column, default 60s), replaces hardcoded 3h in task runner, wired through all 8 adapters
- [x] Result caching layer — in-memory `QueryCacheService` (node-cache), per-connection toggle (`cacheEnabled`/`cacheTtl`), auto-invalidated on connection update
- [x] Large result set streaming — `streamQueryAsync` on `IDatabaseAdapter`, implemented for MSSQL (mssql `request.stream`) and PostgreSQL (`pg.Query` stream), per-connection toggle (`streamEnabled`)
- [x] Preview result limit — test queries capped at 5 rows (full reports return all rows)
- [x] Sensitive data masking — automatic masking of password/secret/token/SSN/credit card columns in preview only (full reports unmasked)
- [x] Cache invalidation — query cache flushed when connection settings are updated

## Phase 5: UX & UI
- [x] Clean light theme with dark-blue primary (`--primary: 227 36% 39%`)
- [x] Alcestis branding (favicon, logo, sidebar brand)
- [x] Professional light sidebar with animated galaxy background
- [x] Profile page at `/profile` — view user info + edit credentials (name, email, phone)
- [x] Profile link in sidebar (bottom links) and navbar dropdown
- [x] Settings tabs restyled with pill/toggle buttons + icons (matching scheduled-report style)
- [x] Dark mode prop scaffolded in Navbar and DataTable
- [x] Responsive mobile layout — collapsible sidebar, responsive tables
- [x] Loading skeletons (report-type cards, audit-logs table rows)
- [x] Toast notifications for all CRUD operations — fallback text, no "undefined", no redundant "Error:" prefix (28+ hooks)
- [x] Empty states with descriptive messages (scheduled-report completed/pending, audit-logs)
- [x] FadeIn page animations (CSS, all major pages)
- [x] Standardised shadcn theme tokens across all tables (`border-border`, `bg-card`, `text-foreground`, `hover:bg-muted/30`)
- [x] All react-icons/fa replaced with lucide-react equivalents
- [x] Consistent sheet widths (400px view / 480px form / 560px complex)
- [x] First-time guided tour (Driver.js, 8 steps covering sidebar, dashboard, reports, connections, settings)
- [x] Security settings page at `/settings/security` — change password, 2FA toggle, login history
- [x] Integration settings page at `/settings/integration` — API keys, webhooks, third-party integrations
- [x] User Preferences page at `/settings/user-preference` — language, timezone, theme selector
- [x] Notification preferences page with state management and save/reset
- [x] Settings tab bar moved to layout — visible across all settings sub-pages
- [x] Settings tabs expanded: Users, Security, Notifications, Integration, User Preferences, System, Audit Logs
- [x] Error boundaries per page (React Error Boundary components)
- [x] Dark mode toggle (UI switch in Navbar, ThemeProvider wired in root layout)
- [x] Avatar upload on profile page (UI with preview + file picker; backend endpoint pending)

## Phase 6: Finance & Insurance Features
- [ ] PCI-DSS compliant data handling
- [x] SOX-compliant audit trails — `AuditLog` entity + global `AuditInterceptor` + paginated viewer
- [ ] Data retention policies (auto-purge old audit logs)
- [ ] Multi-tenant isolation
- [ ] Role-based access control (RBAC) per report
- [ ] Data masking for sensitive columns
- [ ] Compliance report templates
- [ ] Scheduled compliance audits

## Phase 7: Performance & Scale
- [ ] Database query result pagination
- [x] Async report execution (queued jobs via TasksModule)
- [ ] WebSocket-based live query results
- [ ] Connection pool per database type
- [ ] Query plan analysis
- [ ] Database indexing recommendations

## Phase 8: Documentation & DevOps
- [ ] Architecture documentation (`/arch`)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] JSDoc / TSDoc comments on all new modules (audit-log backend + frontend, profile page)
- [ ] Deployment guide (Docker)
- [ ] CI/CD pipeline
- [ ] Database migration strategy
- [ ] Load testing plan
- [ ] Disaster recovery plan

## Legend
- [x] = Done
- [ ] = Pending
