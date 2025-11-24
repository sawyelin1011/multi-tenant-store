# Branding Guide

This guide explains how to customize and change the branding of the MTC Platform.

## Overview

The MTC Platform supports flexible branding through environment variables and configuration files. This allows you to customize the platform appearance, package names, CLI commands, and other brand-specific elements without modifying the source code.

## Brand Configuration

### Default Brand Configuration

The platform uses the following default brand settings:

```typescript
{
  brandName: 'MTC Platform',
  packageScope: 'mtc-platform',
  npmOrg: 'mtc-platform',
  githubOrg: 'mtc-platform',
  brandColor: '#2563eb',
  brandLogo: 'https://cdn.mtcplatform.com/logo.svg',
  platformName: 'MTC Platform',
  cliName: 'mtc-admin',
  docsUrl: 'https://docs.mtcplatform.com',
  supportEmail: 'support@mtcplatform.com'
}
```

### Environment Variables

You can override the default branding using these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MTC_BRAND_NAME` | Brand name for display purposes | `MTC Platform` |
| `MTC_PACKAGE_SCOPE` | NPM package scope (without @) | `mtc-platform` |
| `MTC_NPM_ORG` | NPM organization name | `mtc-platform` |
| `MTC_GITHUB_ORG` | GitHub organization name | `mtc-platform` |
| `MTC_BRAND_COLOR` | Primary brand color (hex code) | `#2563eb` |
| `MTC_BRAND_LOGO` | Brand logo URL or path | `https://cdn.mtcplatform.com/logo.svg` |
| `MTC_PLATFORM_NAME` | Platform display name | `MTC Platform` |
| `MTC_CLI_NAME` | CLI binary name | `mtc-admin` |
| `MTC_DOCS_URL` | Documentation URL | `https://docs.mtcplatform.com` |
| `MTC_SUPPORT_EMAIL` | Support email | `support@mtcplatform.com` |

## Customization Methods

### 1. Environment Variables

Set the environment variables in your `.env` file or system environment:

```bash
# .env
MTC_BRAND_NAME=MyCompany Platform
MTC_PACKAGE_SCOPE=mycompany
MTC_NPM_ORG=mycompany
MTC_GITHUB_ORG=mycompany
MTC_BRAND_COLOR=#ff6b6b
MTC_PLATFORM_NAME=MyCompany Platform
MTC_CLI_NAME=mycompany-admin
```

### 2. CLI Arguments

When scaffolding new plugins, you can override branding per command:

```bash
# Scaffold with custom branding
npx mtc-admin scaffold payment my-payment --brand=mycompany --scope=mycompany

# Global branding options
npx mtc-admin --brand=mycompany --scope=mycompany scaffold payment my-payment
```

### 3. Programmatic Configuration

Import and use the brand configuration in your code:

```typescript
import { brand, loadBrandConfig } from '@mtc-platform/config';

// Use default configuration
console.log(brand.platformName); // "MTC Platform"

// Load with environment overrides
const config = loadBrandConfig();
console.log(config.cliName); // "mtc-admin" or overridden value

// Load with custom overrides
const customConfig = loadBrandConfig({
  brandName: 'MyCompany Platform',
  packageScope: 'mycompany'
});
```

## Rebranding the Entire Platform

### Quick Rebrand

Use the brand sync script to update all references:

```bash
# Update all package names and references
npm run brand:sync

# Install updated dependencies
npm install

# Rebuild packages
npm run build:packages
```

### Manual Rebrand Steps

1. **Update Environment Variables**
   
   Set your brand environment variables in `.env` files.

2. **Run Brand Sync Script**
   
   ```bash
   npm run brand:sync
   ```

3. **Update Dependencies**
   
   ```bash
   npm install
   ```

4. **Rebuild Packages**
   
   ```bash
   npm run build:packages
   ```

5. **Update Documentation**
   
   Manually update any remaining references in documentation files.

## Package Naming

### Package Scope Changes

When you change the package scope, all internal packages are renamed:

- `@mtc-platform/core` - Main platform package
- `@mtc-platform/mtc-admin` - CLI tool
- `@mtc-platform/plugin-sdk` - Plugin development SDK
- `@mtc-platform/config` - Brand configuration utilities

### CLI Binary Name

The CLI binary name changes based on the `MTC_CLI_NAME` environment variable:

- Default: `mtc-admin`
- Custom: `mycompany-admin`

### Plugin Package Names

Scaffolded plugins automatically use the configured package scope:

```json
{
  "dependencies": {
    "@mycompany/plugin-sdk": "^1.0.0"
  }
}
```

## Examples

### Example 1: Company Rebrand

```bash
# Set environment variables
export MTC_BRAND_NAME="Acme Platform"
export MTC_PACKAGE_SCOPE="acme"
export MTC_NPM_ORG="acme"
export MTC_GITHUB_ORG="acme-corp"
export MTC_BRAND_COLOR="#ff6b6b"
export MTC_PLATFORM_NAME="Acme Platform"
export MTC_CLI_NAME="acme-admin"

# Run brand sync
npm run brand:sync

# Verify changes
npm run build:packages
```

### Example 2: Custom Plugin with Brand

```bash
# Scaffold with specific branding
npx mtc-admin scaffold payment stripe-processor \
  --brand="Acme Platform" \
  --scope="acme" \
  --brand-color="#ff6b6b"

# Generated plugin will have:
# - Package name: @acme/plugin-sdk dependency
# - References to "Acme Platform" in documentation
# - Brand-appropriate templates
```

### Example 3: Environment-Based Branding

```bash
# Development
export MTC_BRAND_NAME="Dev Platform"
export MTC_PACKAGE_SCOPE="dev"

# Production
export MTC_BRAND_NAME="Production Platform"
export MTC_PACKAGE_SCOPE="prod"

# The same codebase will use different branding based on environment
```

## File Locations

### Brand Configuration

- **Source**: `packages/config/src/brand.config.ts`
- **Built**: `packages/config/dist/index.js`

### Rebrand Script

- **Location**: `scripts/rebrand.ts`
- **Purpose**: Updates all package.json files and source code references

### Environment Files

- **Main**: `.env.example`
- **Workers**: `.env.example.worker`
- **Local**: `.env.local` (gitignored)

## Troubleshooting

### Common Issues

1. **Package Import Errors**
   
   After rebranding, run `npm install` to update package references.

2. **CLI Command Not Found**
   
   The CLI binary name changes with branding. Use the new name (e.g., `acme-admin`).

3. **Build Failures**
   
   Run `npm run build:packages` after rebranding to rebuild all packages.

4. **Environment Variables Not Applied**
   
   Ensure environment variables are set before running the application.

### Verification Commands

```bash
# Check current brand configuration
node -e "console.log(JSON.stringify(require('@mtc-platform/config').brand, null, 2))"

# Test CLI branding
npx mtc-admin --help

# Verify package names
npm list @mtc-platform/config
```

## Best Practices

1. **Consistent Branding**: Use consistent naming across all brand variables.
2. **Environment Separation**: Use different branding for development vs production.
3. **Documentation Updates**: Keep documentation in sync with brand changes.
4. **Version Control**: Commit brand changes separately from feature changes.
5. **Testing**: Test all CLI commands and package imports after rebranding.

## Support

For branding-related issues:

1. Check the troubleshooting section above
2. Verify environment variable names and values
3. Ensure all dependencies are installed
4. Run the brand sync script if needed

Contact: `support@mtcplatform.com` (or your configured support email)