# Documentation Index

Complete reference guide to all documentation for the MTC Platform.

## Quick Navigation

### 🚀 Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Beginner's guide (start here!)
- **[README.md](../README.md)** - Project overview and features
- **[API.md](../API.md)** - REST API endpoint reference

### 📚 Main Documentation
| Document | Purpose | Audience |
|----------|---------|----------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Beginner's guide, learning paths | Everyone |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design and patterns | Architects, Senior Devs |
| [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) | Visual flowcharts (Mermaid) | Everyone |
| [API.md](../API.md) | REST API reference | API Developers |
| [README.md](../README.md) | Project overview | Everyone |

### ☁️ Cloudflare Workers
| Document | Purpose | Audience |
|----------|---------|----------|
| [cloudflare-migration.md](./cloudflare-migration.md) | Express→Workers migration guide | DevOps, Backend Devs |
| [cloudflare-dev-setup.md](./cloudflare-dev-setup.md) | Local Workers development | Developers |
| [WORKERS_MIGRATION.md](../WORKERS_MIGRATION.md) | Workers architecture overview | Technical Leads |

### 🔌 Plugin System
| Document | Purpose | Audience |
|----------|---------|----------|
| [plugin-development.md](./plugin-development.md) | Plugin SDK and development guide | Plugin Developers |
| [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) | Detailed plugin API reference | Advanced Developers |

### 🎨 Admin Dashboard & UI
| Document | Purpose | Audience |
|----------|---------|----------|
| [ui-theming-with-shadcn.md](./ui-theming-with-shadcn.md) | Dashboard theming and customization | Frontend Devs, Designers |

### 🚢 Deployment & Operations
| Document | Purpose | Audience |
|----------|---------|----------|
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Production deployment guide | DevOps, Infrastructure |
| [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification | DevOps |
| [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) | Project implementation details | Project Managers, Technical Leads |

## By Role

### 👨‍💻 Backend Developer
1. **Start**: [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Setup**: [cloudflare-dev-setup.md](./cloudflare-dev-setup.md)
3. **Learn**: [ARCHITECTURE.md](../ARCHITECTURE.md)
4. **Build**: [plugin-development.md](./plugin-development.md)
5. **Reference**: [API.md](../API.md)

### 🎨 Frontend Developer
1. **Start**: [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Learn UI**: [ui-theming-with-shadcn.md](./ui-theming-with-shadcn.md)
3. **Build Plugins**: [plugin-development.md](./plugin-development.md) (UI section)
4. **Setup Dev**: [cloudflare-dev-setup.md](./cloudflare-dev-setup.md)
5. **Reference**: [API.md](../API.md)

### 🏗️ DevOps / Infrastructure
1. **Start**: [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Learn Arch**: [ARCHITECTURE.md](../ARCHITECTURE.md)
3. **Migrate to Workers**: [cloudflare-migration.md](./cloudflare-migration.md)
4. **Deploy**: [DEPLOYMENT.md](../DEPLOYMENT.md)
5. **Checklist**: [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)

### 🎯 Technical Lead / Architect
1. **Overview**: [README.md](../README.md)
2. **Architecture**: [ARCHITECTURE.md](../ARCHITECTURE.md)
3. **Diagrams**: [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
4. **Workers Strategy**: [WORKERS_MIGRATION.md](../WORKERS_MIGRATION.md)
5. **Implementation**: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)

### 📊 Product Manager / Business
1. **Overview**: [README.md](../README.md)
2. **Getting Started**: [GETTING_STARTED.md](./GETTING_STARTED.md)
3. **Features**: [README.md](../README.md) (Features section)
4. **Deployment**: [DEPLOYMENT.md](../DEPLOYMENT.md) (high-level)

## By Task

### I want to...

#### Run the platform locally
→ [cloudflare-dev-setup.md](./cloudflare-dev-setup.md) - Local development with Workers/Miniflare

#### Compare Express vs Workers
→ [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md#runtime-comparison)

#### Understand the architecture
→ [ARCHITECTURE.md](../ARCHITECTURE.md) + [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)

#### Build a custom plugin
→ [plugin-development.md](./plugin-development.md)

#### Migrate PostgreSQL to D1
→ [cloudflare-migration.md](./cloudflare-migration.md#data-migration-utility)

#### Customize the admin dashboard
→ [ui-theming-with-shadcn.md](./ui-theming-with-shadcn.md)

#### Deploy to production
→ [DEPLOYMENT.md](../DEPLOYMENT.md)

#### Troubleshoot an issue
→ [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting) or [cloudflare-dev-setup.md](./cloudflare-dev-setup.md#troubleshooting)

#### Learn about payment processing
→ [ARCHITECTURE.md](../ARCHITECTURE.md#payment-system) + [examples/stripe-plugin](../examples/stripe-plugin/)

#### Understand multi-tenancy
→ [ARCHITECTURE.md](../ARCHITECTURE.md#multi-tenancy) + [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md#multi-tenant-data-isolation)

#### Check API endpoints
→ [API.md](../API.md)

## Documentation Map

```
docs/
├── INDEX.md                           ← You are here
├── GETTING_STARTED.md                 ← Start here for beginners
├── ARCHITECTURE_DIAGRAMS.md           ← Visual flowcharts
├── cloudflare-migration.md            ← Express to Workers
├── cloudflare-dev-setup.md            ← Local development
├── plugin-development.md              ← Build plugins
└── ui-theming-with-shadcn.md          ← Customize UI

Root documentation/
├── README.md                          ← Project overview
├── ARCHITECTURE.md                    ← System design
├── API.md                             ← REST API reference
├── PLUGIN_DEVELOPMENT.md              ← Plugin API details
├── WORKERS_MIGRATION.md               ← Workers overview
├── DEPLOYMENT.md                      ← Production deployment
├── DEPLOYMENT_CHECKLIST.md            ← Pre-deployment checks
└── IMPLEMENTATION_SUMMARY.md          ← Project summary

examples/
└── stripe-plugin/                     ← Sample plugin code

src/
├── services/                          ← Business logic
├── routes/                            ← API routes
├── middleware/                        ← Express middleware
├── worker.ts                          ← Workers entry point
└── index.ts                           ← Express entry point
```

## Learning Paths

### Path 1: Express Developer (2-3 days)
1. [GETTING_STARTED.md](./GETTING_STARTED.md) (1 hour)
2. [README.md](../README.md) (30 min)
3. Setup local with `npm run dev` (1 hour)
4. [ARCHITECTURE.md](../ARCHITECTURE.md) (2 hours)
5. [API.md](../API.md) reference (1 hour)
6. Try sample plugin from [examples/stripe-plugin](../examples/stripe-plugin/) (3 hours)
7. [plugin-development.md](./plugin-development.md) (2 hours)
8. Build first custom plugin (4 hours)

### Path 2: Workers Developer (3-4 days)
1. [GETTING_STARTED.md](./GETTING_STARTED.md) (1 hour)
2. [cloudflare-dev-setup.md](./cloudflare-dev-setup.md) (2 hours)
3. Setup local with `npm run cf:dev` (1 hour)
4. [cloudflare-migration.md](./cloudflare-migration.md) overview (1 hour)
5. [ARCHITECTURE.md](../ARCHITECTURE.md) (2 hours)
6. [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) (1 hour)
7. [cloudflare-migration.md](./cloudflare-migration.md) deep dive (3 hours)
8. [DEPLOYMENT.md](../DEPLOYMENT.md) (1 hour)

### Path 3: Full-Stack Developer (4-5 days)
- Combine Express + Workers paths (7-8 hours)
- [plugin-development.md](./plugin-development.md) (2 hours)
- [ui-theming-with-shadcn.md](./ui-theming-with-shadcn.md) (2 hours)
- Build sample plugin with UI (4 hours)
- Deploy to staging (2 hours)

### Path 4: DevOps/Infrastructure (2-3 days)
1. [GETTING_STARTED.md](./GETTING_STARTED.md) (1 hour)
2. [ARCHITECTURE.md](../ARCHITECTURE.md) (2 hours)
3. [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) (1 hour)
4. [cloudflare-migration.md](./cloudflare-migration.md) (3 hours)
5. [DEPLOYMENT.md](../DEPLOYMENT.md) (2 hours)
6. [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) (1 hour)
7. Practice deployment to staging (4 hours)

## Document Descriptions

### Core Platform Documentation

**README.md** (571 lines)
- Project overview
- Feature list
- Quick setup instructions
- API endpoint summary
- Deployment options
- Plugin structure overview

**ARCHITECTURE.md** (549+ lines)
- System overview and core principles
- Multi-tenancy design
- Database schema details
- API architecture
- Service layer design
- Plugin system architecture
- Scalability & security

**API.md** (14,745 bytes)
- Complete REST API reference
- All endpoints documented
- Request/response examples
- Authentication details
- Error codes

### Cloudflare Workers Documentation

**WORKERS_MIGRATION.md** (323 lines)
- Workers migration overview
- Architecture comparison
- Configuration details
- Deployment workflow
- Performance considerations
- Troubleshooting

**docs/cloudflare-migration.md** (1000+ lines)
- Detailed Express→Workers migration guide
- Database migration (PostgreSQL→D1)
- Performance considerations (30s timeout, memory limits)
- Data migration utility
- Deployment checklist
- Troubleshooting guide

**docs/cloudflare-dev-setup.md** (1000+ lines)
- Complete local development guide
- Environment setup
- Wrangler CLI reference
- Testing and debugging
- Troubleshooting

### Plugin & Extension Documentation

**PLUGIN_DEVELOPMENT.md** (563 lines)
- Plugin structure
- Plugin manifest details
- Hook system
- API endpoints
- Database migrations
- Testing plugins

**docs/plugin-development.md** (1000+ lines)
- Comprehensive plugin development guide
- Plugin lifecycle
- Hook examples
- UI component integration (shadcn/ui)
- API endpoint examples
- Testing strategies

### UI & Frontend Documentation

**docs/ui-theming-with-shadcn.md** (800+ lines)
- shadcn/ui setup and configuration
- Theming system
- Component library reference
- Customization guide
- Plugin UI integration
- Responsive design
- Accessibility

### Getting Started & Guides

**docs/GETTING_STARTED.md** (600+ lines)
- Quick start (5 minutes)
- Learning paths (beginner → advanced)
- Architecture overview
- Common tasks
- Troubleshooting
- FAQ

**docs/ARCHITECTURE_DIAGRAMS.md** (500+ lines)
- Mermaid flowcharts
- Request flow (Express vs Workers)
- Plugin lifecycle
- UI component resolution
- Data flow examples
- Deployment architecture

### Deployment Documentation

**DEPLOYMENT.md**
- Production deployment guide
- Environment configuration
- Database setup
- Security checklist
- Monitoring setup

**DEPLOYMENT_CHECKLIST.md**
- Pre-deployment verification checklist
- Security review
- Performance testing
- Backup procedures

## Linking Resources

Each documentation file links to:
- Related guides (cross-references)
- Sample code (examples/stripe-plugin/)
- API reference
- External resources
- Next steps

**External Resources Linked:**
- [Hono.js Framework](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Express.js Docs](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/)

## Search Tips

**Finding information by keyword:**

| Keyword | Document | Section |
|---------|----------|---------|
| Performance | cloudflare-migration.md | Performance Considerations |
| Timeout | cloudflare-migration.md | 30-second timeout limit |
| D1 | cloudflare-migration.md | Database Migration |
| KV | cloudflare-migration.md | KV Consistency Model |
| Plugin | plugin-development.md | Plugin System |
| Hook | plugin-development.md | Hooks System |
| Theme | ui-theming-with-shadcn.md | Theming System |
| Component | ui-theming-with-shadcn.md | Component Library |
| Deploy | DEPLOYMENT.md | Production Deployment |
| Test | cloudflare-dev-setup.md | Testing |
| Debug | cloudflare-dev-setup.md | Debugging |

## Contribution Guidelines

When updating documentation:

1. **Keep it current** - Update when code changes
2. **Add examples** - Show practical usage
3. **Link related docs** - Cross-reference sections
4. **Use diagrams** - Mermaid for visual flows
5. **Include troubleshooting** - Common issues and solutions
6. **Update this index** - Add new documents here
7. **Check links** - Ensure all links are valid

## Version History

### Current Version: 2.0.0

**Changes:**
- Added Cloudflare Workers support
- New docs: cloudflare-migration.md, cloudflare-dev-setup.md
- Updated plugin-development.md for shadcn/ui
- Added ARCHITECTURE_DIAGRAMS.md
- Created comprehensive GETTING_STARTED.md

### Previous Version: 1.0.0
- Express.js only
- PostgreSQL database
- Basic plugin system
- Admin dashboard (React)

## Support

- **Technical Questions**: Check relevant documentation section
- **Code Examples**: See [examples/stripe-plugin](../examples/stripe-plugin/)
- **API Reference**: [API.md](../API.md)
- **Architecture Questions**: [ARCHITECTURE.md](../ARCHITECTURE.md) + [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)

---

**Last Updated**: November 2024
**Documentation Version**: 2.0.0
**Platform Version**: 1.0.0 (with Workers support)
