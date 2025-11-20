# MTC Platform Config

Brand configuration utilities for MTC Platform.

## Usage

### Basic Usage

```typescript
import { brand, loadBrandConfig } from '@mtc-platform/config';

// Use default configuration
console.log(brand.platformName); // "MTC Platform"
console.log(brand.packageScope); // "mtc-platform"

// Load with environment variable overrides
const config = loadBrandConfig();
```

### Environment Variables

The following environment variables can be used to override the default brand configuration:

- `MTC_BRAND_NAME` - Brand name for display purposes
- `MTC_PACKAGE_SCOPE` - NPM package scope (without @)
- `MTC_NPM_ORG` - NPM organization name
- `MTC_GITHUB_ORG` - GitHub organization name
- `MTC_BRAND_COLOR` - Primary brand color (hex code)
- `MTC_BRAND_LOGO` - Brand logo URL or path
- `MTC_PLATFORM_NAME` - Platform display name
- `MTC_CLI_NAME` - CLI binary name
- `MTC_DOCS_URL` - Documentation URL
- `MTC_SUPPORT_EMAIL` - Support email

### CLI Usage

```typescript
import { loadBrandConfigFromArgs } from '@mtc-platform/config';

// Load configuration from CLI arguments
const config = loadBrandConfigFromArgs({
  brand: 'MyCompany',
  scope: 'mycompany',
  'brand-color': '#ff6b6b'
});
```

### Utility Functions

```typescript
import { getPackageScope, getCliName, getPlatformName } from '@mtc-platform/config';

// Get scoped package name
const packageName = getPackageScope('admin-cli'); // "@mtc-platform/admin-cli"

// Get CLI binary name
const cliName = getCliName(); // "mtc-admin"

// Get platform name
const platformName = getPlatformName(); // "MTC Platform"
```

## License

MIT