# Alcestis Reporting — Feature Roadmap

## Phase 1: Multi-Database Parity (Current)
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
- [ ] Encrypt connection credentials at rest (AES-256)
- [ ] Audit logging for all database queries
- [ ] Row-level security policies
- [ ] SQL injection prevention audit
- [ ] Secrets management (env-based, not hardcoded JWT)
- [ ] Replace `synchronize: true` with migrations

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
- [ ] Scheduled report execution with cron
- [ ] Report export: PDF, XLSX, CSV
- [ ] Email delivery of reports
- [ ] Report templates with parameterized queries
- [ ] Report execution history with logs
- [ ] Query timeout per data source
- [ ] Result caching layer
- [ ] Large result set streaming

## Phase 5: UX & UI (Velzon-Inspired)
- [x] Clean light theme with indigo accent
- [x] Alcestis branding (favicon, logo)
- [x] Professional light sidebar
- [ ] Profile dropdown with avatar upload
- [ ] Dark mode toggle (already scaffolded)
- [ ] Responsive mobile layout
- [ ] Loading skeletons
- [ ] Toast notifications for all CRUD operations
- [ ] Empty states with illustrations
- [ ] Error boundaries per page

## Phase 6: Finance & Insurance Features
- [ ] PCI-DSS compliant data handling
- [ ] SOX-compliant audit trails
- [ ] Data retention policies
- [ ] Multi-tenant isolation
- [ ] Role-based access control (RBAC) per report
- [ ] Data masking for sensitive columns
- [ ] Compliance report templates
- [ ] Scheduled compliance audits

## Phase 7: Performance & Scale
- [ ] Database query result pagination
- [ ] Async report execution (queued jobs)
- [ ] WebSocket-based live query results
- [ ] Connection pool per database type
- [ ] Query plan analysis
- [ ] Database indexing recommendations

## Phase 8: Documentation & DevOps
- [ ] Architecture documentation (/arch)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide (Docker)
- [ ] CI/CD pipeline
- [ ] Database migration strategy
- [ ] Load testing plan
- [ ] Disaster recovery plan

## Legend
- [x] = Done
- [ ] = Pending
- [ ] = Blocked
