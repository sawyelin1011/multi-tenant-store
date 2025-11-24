# MTC Platform Documentation

Welcome to the comprehensive documentation for the Multi-Tenant Commerce Platform. This documentation is organized to serve different audiences - from end users and plugin developers to platform contributors and DevOps teams.

## 📚 Documentation Structure

```
docs/
├── README.md                    ← You are here - Documentation overview
├── QUICK_START.md              ← Quick start guide for all users
├── DEVELOPMENT/                ← Internal development docs
│   ├── README.md               ← Development overview
│   ├── ARCHITECTURE.md         ← System design and patterns
│   ├── SETUP.md                ← Development environment setup
│   ├── CONTRIBUTING.md         ← Contribution guidelines
│   ├── DATABASE.md             ← Database schema and migrations
│   └── SECURITY.md             ← Security guidelines
├── API/                        ← API documentation
│   ├── README.md               ← API overview
│   ├── REST_API.md             ← REST API reference
│   └── GRAPHQL_API.md          ← GraphQL API (if applicable)
├── PLUGINS/                    ← Plugin development docs
│   ├── README.md               ← Plugin system overview
│   ├── DEVELOPMENT_GUIDE.md    ← Plugin development guide
│   ├── API_REFERENCE.md        ← Plugin API reference
│   └── EXAMPLES.md             ← Plugin examples and patterns
├── TEMPLATES/                  ← Template documentation
│   ├── README.md               ← Template system overview
│   ├── STORE_TEMPLATES.md      ← Store template guide
│   └── PRODUCT_TEMPLATES.md    ← Product template guide
└── DEPLOYMENT/                 ← Deployment and operations
    ├── README.md               ← Deployment overview
    ├── PRODUCTION.md           ← Production deployment guide
    ├── CLOUDFLARE_WORKERS.md   ← Cloudflare Workers deployment
    └── CHECKLIST.md           ← Pre-deployment checklist
```

## 🎯 Target Audiences

### 👥 End Users & Store Owners
- **Start with**: [QUICK_START.md](./QUICK_START.md)
- **Focus**: Store setup, product management, order processing
- **Key Sections**: Templates, basic API usage

### 🔌 Plugin Developers
- **Start with**: [PLUGINS/README.md](./PLUGINS/README.md)
- **Focus**: Building custom functionality, extending platform
- **Key Sections**: Plugin development guide, API reference, examples

### 🏗️ Platform Contributors
- **Start with**: [DEVELOPMENT/README.md](./DEVELOPMENT/README.md)
- **Focus**: Core platform development, architecture, internals
- **Key Sections**: Architecture, setup, contributing guidelines

### 🚀 DevOps & Infrastructure Teams
- **Start with**: [DEPLOYMENT/README.md](./DEPLOYMENT/README.md)
- **Focus**: Deployment, scaling, monitoring, security
- **Key Sections**: Production deployment, Cloudflare Workers, security

## 🚀 Quick Navigation

### New to the Platform?
1. **[Quick Start Guide](./QUICK_START.md)** - Get running in 5 minutes
2. **[Template Overview](./TEMPLATES/README.md)** - Understand store templates
3. **[Basic API Usage](./API/README.md)** - Learn core API concepts

### Want to Build Plugins?
1. **[Plugin System Overview](./PLUGINS/README.md)** - Understand the plugin architecture
2. **[Plugin Development Guide](./PLUGINS/DEVELOPMENT_GUIDE.md)** - Build your first plugin
3. **[Plugin Examples](./PLUGINS/EXAMPLES.md)** - See real-world examples

### Want to Contribute to Core?
1. **[Development Overview](./DEVELOPMENT/README.md)** - Development setup and guidelines
2. **[Architecture Guide](./DEVELOPMENT/ARCHITECTURE.md)** - Understand system design
3. **[Contributing Guide](./DEVELOPMENT/CONTRIBUTING.md)** - Contribution workflow

### Want to Deploy to Production?
1. **[Deployment Overview](./DEPLOYMENT/README.md)** - Deployment options and strategies
2. **[Production Guide](./DEPLOYMENT/PRODUCTION.md)** - Step-by-step production deployment
3. **[Cloudflare Workers](./DEPLOYMENT/CLOUDFLARE_WORKERS.md)** - Edge deployment option

## 📖 Documentation Features

### 🎨 Visual Diagrams
Architecture diagrams and flowcharts are included throughout the documentation using Mermaid syntax. Key diagrams include:
- Request flow comparisons (Express vs Workers)
- Plugin lifecycle visualization
- Data flow examples
- Deployment architecture

See [DEVELOPMENT/ARCHITECTURE.md](./DEVELOPMENT/ARCHITECTURE.md) for complete diagram collection.

### 🔗 Cross-References
All documentation files are extensively cross-referenced to help you navigate between related topics.

### 💡 Practical Examples
Every guide includes practical, copy-pasteable examples and real-world scenarios.

### 🧪 Testing & Troubleshooting
Each section includes troubleshooting tips and testing strategies.

## 🌐 Publishing to GitHub Wiki

This documentation can be automatically published to the GitHub Wiki for easy online access. Use the following subtree push method:

```bash
# First-time setup (run from repository root)
git subtree add --prefix docs origin wiki

# To publish updates to wiki
git subtree push --prefix docs origin wiki
```

**Alternative method** (if subtree doesn't work):
```bash
# Clone wiki separately
git clone https://github.com/your-org/mtc-platform.wiki.git wiki

# Copy docs to wiki
cp -r docs/* wiki/
cd wiki
git add .
git commit -m "Update documentation"
git push origin main
```

## 📝 File Migration Map

The following files have been reorganized in this documentation overhaul:

| Old Location | New Location | Purpose |
|--------------|--------------|---------|
| `docs/INDEX.md` | Incorporated into various files | Documentation index |
| `docs/GETTING_STARTED.md` | `docs/QUICK_START.md` | User quick start |
| `ARCHITECTURE.md` | `docs/DEVELOPMENT/ARCHITECTURE.md` | System architecture |
| `DEVELOPMENT.md` | `docs/DEVELOPMENT/SETUP.md` | Development setup |
| `DATABASE_MIGRATION_GUIDE.md` | `docs/DEVELOPMENT/DATABASE.md` | Database docs |
| `DRIZZLE_MIGRATION.md` | `docs/DEVELOPMENT/DATABASE.md` | Database migrations |
| `IMPLEMENTATION_SUMMARY.md` | `docs/DEVELOPMENT/ARCHITECTURE.md` | Implementation details |
| `TESTING.md` | `docs/DEVELOPMENT/CONTRIBUTING.md` | Testing guidelines |
| `API.md` | `docs/API/REST_API.md` | REST API reference |
| `PLUGIN_DEVELOPMENT.md` | `docs/PLUGINS/DEVELOPMENT_GUIDE.md` | Plugin development |
| `plugin-development.md` | `docs/PLUGINS/DEVELOPMENT_GUIDE.md` | Plugin guide |
| `DEPLOYMENT.md` | `docs/DEPLOYMENT/PRODUCTION.md` | Production deployment |
| `DEPLOYMENT_CHECKLIST.md` | `docs/DEPLOYMENT/CHECKLIST.md` | Deployment checklist |
| `cloudflare-migration.md` | `docs/DEPLOYMENT/CLOUDFLARE_WORKERS.md` | Workers deployment |
| `cloudflare-dev-setup.md` | `docs/DEVELOPMENT/SETUP.md` | Development setup |
| `ui-theming-with-shadcn.md` | `docs/TEMPLATES/STORE_TEMPLATES.md` | UI theming |
| `ARCHITECTURE_DIAGRAMS.md` | Integrated into `docs/DEVELOPMENT/ARCHITECTURE.md` | Diagrams |
| `BRANDING.md` | `docs/TEMPLATES/STORE_TEMPLATES.md` | Branding guidelines |

## 🔄 Keeping Documentation Updated

### For Contributors
1. Update documentation alongside code changes
2. Add new examples and use cases
3. Update cross-references when adding new sections
4. Test all links and examples before submitting PRs

### For Maintainers
1. Review documentation changes in PRs
2. Ensure new features are documented
3. Update the migration map when reorganizing
4. Publish to GitHub Wiki on major releases

## 🆘 Getting Help

1. **Check the relevant section** - Most answers are in the specific documentation
2. **Search by keyword** - Use the table of contents and search features
3. **Check examples** - Look in the `examples/` directory for code samples
4. **Review troubleshooting sections** - Each guide has troubleshooting tips
5. **Check archived docs** - Some older content may be in the original files during transition

## 📊 Documentation Metrics

- **Total Guide Files**: 15+ comprehensive guides
- **Code Examples**: 100+ practical examples
- **Architecture Diagrams**: 10+ Mermaid diagrams
- **Target Audiences**: 4 distinct user groups
- **Deployment Options**: 3+ deployment strategies

---

**Last Updated**: 2024-11-24  
**Documentation Version**: 3.0.0  
**Platform Version**: 2.0.0  

For the most up-to-date information, always check the repository root [README.md](../README.md) for the latest features and changes.