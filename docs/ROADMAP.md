# CoSheet Development Roadmap 🗓️

Lộ trình phát triển CoSheet theo 4 phases, từ Stabilization → Security → Performance → Features

---

## 📋 Phase 1: Stabilization & Foundation (1-2 tuần)

**Mục tiêu:** Code quality, dependency updates, development workflow

### ✅ Completed (Dec 1, 2025)
- [x] Version bump to 1.0.0
- [x] Rate limiting middleware (express-rate-limit)
- [x] CSRF protection (double-submit cookie pattern)
- [x] Security headers (Helmet)
- [x] Centralized logging (Winston with daily rotation)
- [x] Health check endpoints (/health, /metrics, /health/ready, /health/alive)
- [x] Error handling middleware

### 🔄 In Progress
- [ ] Cleanup backup files (.backup, .dropdown_version)
- [ ] Add .gitignore for node_modules, logs, .env
- [ ] ESLint configuration
- [ ] Prettier auto-formatting
- [ ] Pre-commit hooks (Husky + lint-staged)

### 📝 Todo
- [ ] Refactor topmenu.js (931 lines → modular structure)
  ```
  static/topmenu/
  ├── index.js
  ├── tabs-integration.js
  ├── save-handler.js
  ├── dialogs.js
  └── utils.js
  ```
- [ ] Add JSDoc type annotations
- [ ] Update README with new v1.0 features
- [ ] Create CONTRIBUTING.md guide

**Success Criteria:**
- ✅ All tests pass (when tests are added)
- ✅ No ESLint warnings
- ✅ Clean git history
- ✅ Documentation up-to-date

---

## 🔒 Phase 2: Security Hardening (2-4 tuần)

**Mục tiêu:** Production-ready security posture

### ✅ Completed
- [x] Rate limiting (API, sheet ops, uploads)
- [x] CSRF protection
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Request logging
- [x] Error logging with stack traces

### 🔄 In Progress
- [ ] Dependency security audit
  ```bash
  npm audit fix
  npm audit fix --force  # For breaking changes
  ```
- [ ] Update critical dependencies:
  - [ ] redis: 0.12.x → 4.x
  - [ ] webpack: 1.x → 5.x
  - [ ] zappajs → Express.js (major migration)

### 📝 Todo (Future - Authentication system)
- [ ] **User Authentication** (POSTPONED until OAuth2 setup)
  - [ ] Local strategy (email/password)
  - [ ] Google OAuth 2.0
  - [ ] Session management (Redis-backed)
  - [ ] Password hashing (bcrypt)
  
- [ ] **Authorization & Permissions**
  - [ ] Sheet-level permissions (owner, editor, viewer)
  - [ ] Share links with expiration
  - [ ] Public/Private sheets toggle
  
- [ ] **Security Testing**
  - [ ] Penetration testing (OWASP Top 10)
  - [ ] SQL injection tests (not applicable - Redis)
  - [ ] XSS tests
  - [ ] CSRF tests
  - [ ] Rate limit bypass tests

**Success Criteria:**
- ✅ npm audit shows 0 critical/high vulnerabilities
- ✅ Security headers A+ rating (securityheaders.com)
- ✅ Pen test report shows no major issues
- ✅ Rate limiting blocks 99% of spam attempts

---

## ⚡ Phase 3: Performance & Scalability (1 tháng)

**Mục tiêu:** Handle 100+ concurrent users, optimize for Cloudflare CDN

### 🔄 In Progress
- [ ] **Cloudflare Optimization**
  - [ ] Page Rules for caching static assets
  - [ ] Workers for edge caching (if needed)
  - [ ] Argo Smart Routing
  - [ ] Polish (compress images)
  - [ ] Rocket Loader (defer JS)
  
- [ ] **Caching Strategy**
  - [ ] Redis caching layer for read-heavy operations
  - [ ] HTTP cache headers (ETag, Last-Modified)
  - [ ] Browser caching (Service Worker)
  - [ ] CDN caching (Cloudflare)

### 📝 Todo
- [ ] **Horizontal Scaling**
  - [ ] Cluster mode (multi-core)
  - [ ] Sticky sessions for WebSocket
  - [ ] Load balancer config (nginx/HAProxy)
  - [ ] Redis cluster (for HA)
  
- [ ] **Frontend Optimization**
  - [ ] Code splitting (lazy load modules)
  - [ ] Tree shaking (remove unused code)
  - [ ] Image optimization (WebP, lazy loading)
  - [ ] Minification & compression (Brotli)
  - [ ] Service Worker for offline support
  
- [ ] **Database Optimization**
  - [ ] Redis pipelining (batch operations)
  - [ ] Connection pooling
  - [ ] Query optimization
  - [ ] Data structure optimization (use sorted sets)
  
- [ ] **Load Testing**
  - [ ] Artillery/K6 test scenarios
  - [ ] Target: 100 concurrent users @ <200ms avg response time
  - [ ] Stress test: 500 concurrent users
  - [ ] WebSocket load test (realtime collaboration)

**Performance Targets:**
- 📊 Time to First Byte (TTFB): <100ms
- 📊 First Contentful Paint (FCP): <1s
- 📊 Time to Interactive (TTI): <3s
- 📊 Server response time: <50ms (p95)
- 📊 WebSocket latency: <100ms
- 📊 Concurrent users: 100+ without degradation

**Success Criteria:**
- ✅ Load test passes with 100 concurrent users
- ✅ Lighthouse score: 90+ (Performance, Accessibility, Best Practices)
- ✅ Redis memory usage < 1GB for 10k sheets
- ✅ CPU usage < 70% under peak load
- ✅ Zero downtime deployments

---

## 🎨 Phase 4: Feature Development (Ongoing)

**Mục tiêu:** Implement user-facing features from ENHANCEMENT.md

### 🔄 Short-term (Next 3 months)
- [ ] **Mobile UX Improvements**
  - [ ] Touch gestures for charts (pinch zoom, pan)
  - [ ] Dark mode toggle
  - [ ] Mobile-optimized chart toolbar
  - [ ] Gesture-friendly cell selection
  
- [ ] **PDF Export**
  - [ ] jsPDF integration
  - [ ] Preserve formatting
  - [ ] Page layout options
  - [ ] Print range selection
  
- [ ] **Enhanced Clipboard**
  - [ ] Paste from Excel (retain formatting)
  - [ ] Copy as HTML/Markdown
  - [ ] Paste special (values only, formulas only)

### 📝 Mid-term (3-6 months)
- [ ] **Google Sheets Import**
  - [ ] OAuth 2.0 flow
  - [ ] List accessible sheets
  - [ ] Import data + formatting
  - [ ] Formula conversion
  
- [ ] **Cell Comments**
  - [ ] Threaded comments
  - [ ] @mentions
  - [ ] Realtime sync
  
- [ ] **Version History**
  - [ ] Auto-snapshots
  - [ ] Visual diff viewer
  - [ ] Restore functionality
  
- [ ] **Templates**
  - [ ] Template gallery
  - [ ] Categories (business, education, personal)
  - [ ] One-click create

### 📝 Long-term (6-12 months)
- [ ] **AI Assistant** (GPT-4)
- [ ] **Pivot Tables**
- [ ] **Conditional Formatting**
- [ ] **Data Validation**
- [ ] **Webhooks & Automation**

See [ENHANCEMENT.md](./ENHANCEMENT.md) for detailed feature specifications.

---

## 🚀 Release Schedule

### v1.0.0 (December 1, 2025) - Production Ready ✅
- Security hardening (rate limiting, CSRF, helmet)
- Logging & monitoring
- Health checks
- Cloudflare integration

### v1.1.0 (December 2025) - Performance & UX
- Mobile gestures
- Dark mode
- Code refactoring
- Load testing

### v1.2.0 (January 2026) - Export & Import
- PDF export
- Google Sheets import
- Enhanced clipboard

### v1.3.0 (February 2026) - Collaboration
- Cell comments
- Version history
- Real-time presence

### v1.4.0 (March 2026) - Templates & Discovery
- Template marketplace
- Advanced charts
- Conditional formatting

### v2.0.0 (Q2 2026) - AI & Automation
- GPT-4 integration
- Pivot tables
- Webhooks
- Enterprise features

---

## 📊 Success Metrics (KPIs)

### Technical Metrics
- **Uptime:** 99.9% (track with Pingdom/UptimeRobot)
- **Performance:** p95 < 200ms response time
- **Error rate:** < 0.1% of requests
- **Security incidents:** 0 critical vulnerabilities
- **Test coverage:** 80%+ (when tests added)

### User Metrics
- **Active users:** Track MAU (Monthly Active Users)
- **Sheets created:** Daily/weekly count
- **Collaboration sessions:** Concurrent editing events
- **Feature adoption:** % of users using new features
- **User retention:** 7-day, 30-day retention rate

### Business Metrics (If applicable)
- **Conversion rate:** Free → Paid (if SaaS model)
- **Churn rate:** < 5% monthly
- **NPS (Net Promoter Score):** > 50
- **Support tickets:** < 10/week

---

## 🛠️ Development Workflow

### Git Branching Strategy
```
master (production)
  ├── develop (staging)
      ├── feature/mobile-gestures
      ├── feature/pdf-export
      ├── bugfix/chart-rendering
      └── hotfix/security-patch
```

### Commit Convention
```
feat: Add PDF export functionality
fix: Fix chart rendering on mobile
perf: Optimize Redis queries
docs: Update README with v1.0 features
test: Add unit tests for topmenu
refactor: Modularize topmenu.js
chore: Update dependencies
```

### CI/CD Pipeline (Future)
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  - lint (ESLint)
  - test (Jest/Mocha)
  - build (webpack)
  - security (npm audit)
  - deploy (to staging on develop branch)
```

---

## 📞 Communication & Collaboration

### Weekly Sync
- **When:** Every Monday 10:00 AM
- **What:** Review roadmap progress, blockers, priorities
- **Where:** GitHub Discussions / Discord / Slack

### Issue Tracking
- **GitHub Issues:** Bug reports, feature requests
- **GitHub Projects:** Kanban board for task management
- **Milestones:** Track progress toward releases

### Documentation
- **README.md:** Quick start guide
- **ENHANCEMENT.md:** Feature wishlist
- **ROADMAP.md:** This file (development plan)
- **CONTRIBUTING.md:** How to contribute
- **API.md:** API documentation

---

## 🎯 Focus Areas by Phase

| Phase | Security | Performance | Features | UX/UI |
|-------|----------|-------------|----------|-------|
| **1: Stabilization** | ⭐⭐⭐ | ⭐ | - | - |
| **2: Security** | ⭐⭐⭐⭐⭐ | ⭐⭐ | - | ⭐ |
| **3: Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ |
| **4: Features** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

**Last updated:** December 1, 2025  
**Current Phase:** 1 & 2 (Stabilization + Security)  
**Next Milestone:** v1.1.0 (Performance & UX)  
**Maintainer:** phucdhh
