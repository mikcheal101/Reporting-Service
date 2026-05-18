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
- [ ] Health check endpoint (`GET /api/v1/health`)
- [ ] Structured logging (JSON format)
- [ ] OpenTelemetry tracing
- [ ] Metrics endpoint (Prometheus)
- [ ] Graceful shutdown handler
- [ ] Database connection pool monitoring
- [ ] Circuit breaker for external DB connections
- [ ] Error tracking integration (Sentry)

## Phase 4: Reporting Engine
- [x] Scheduled report execution with cron
- [x] Report export: PDF, XLSX, CSV
- [x] Email delivery of reports
- [x] Report templates with parameterized queries
- [x] Report execution history with logs
- [ ] Query timeout per data source
- [ ] Result caching layer
- [ ] Large result set streaming

## Phase 5: UX & UI
- [x] Clean light theme with dark-blue primary (`--primary: 227 36% 39%`)
- [x] Alcestis branding (favicon, logo, sidebar brand)
- [x] Professional light sidebar with animated galaxy background
- [x] Profile page at `/profile` — view user info + edit credentials (name, email, phone)
- [x] Profile link in sidebar (bottom links) and navbar dropdown
- [x] Settings tabs restyled with pill/toggle buttons + icons (matching scheduled-report style)
- [x] Dark mode prop scaffolded in Navbar and DataTable (no toggle UI yet)
- [x] Responsive mobile layout — collapsible sidebar, responsive tables
- [x] Loading skeletons (report-type cards, audit-logs table rows)
- [x] Toast notifications for all CRUD operations — fallback text, no "undefined", no redundant "Error:" prefix (28+ hooks)
- [x] Empty states with descriptive messages (scheduled-report completed/pending, audit-logs)
- [x] FadeIn page animations (CSS, all major pages)
- [x] Standardised shadcn theme tokens across all tables (`border-border`, `bg-card`, `text-foreground`, `hover:bg-muted/30`)
- [x] All react-icons/fa replaced with lucide-react equivalents
- [x] Consistent sheet widths (400px view / 480px form / 560px complex)
- [ ] Error boundaries per page (React Error Boundary components)
- [ ] Dark mode toggle (UI switch)
- [ ] Avatar upload on profile page

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
