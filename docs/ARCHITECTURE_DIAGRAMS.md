# Architecture Diagrams

Visual flowcharts and diagrams illustrating the system architecture, request flow, and key processes.

## Table of Contents

1. [Request Flow](#request-flow)
2. [Plugin Lifecycle](#plugin-lifecycle)
3. [UI Component Resolution](#ui-component-resolution)
4. [Data Flow Examples](#data-flow-examples)
5. [Runtime Comparison](#runtime-comparison)

## Request Flow

### Workers Request Flow (Edge Computing)

```mermaid
graph TD
    A["Client Request<br/>(anywhere in world)"] -->|Route to nearest edge| B["Cloudflare Edge<br/>(30+ locations)"]
    B -->|Worker Handler| C["Hono Router"]
    C -->|Extract Path| D["Route Matching"]
    D -->|JWT Verification| E["Auth Middleware"]
    E -->|Extract Tenant| F["Tenant Resolution"]
    F -->|Query Execution| G["D1 SQLite"]
    G -->|Read/Write| H["KV Cache Layer"]
    H -->|File Ops| I["R2 Storage"]
    I -->|Response Assembly| J["JSON Response"]
    J -->|Cached at Edge| K["Global Cache"]
    K -->|Return to Client| L["Ultra-Low Latency Response"]
    
    style A fill:#e1f5ff
    style L fill:#c8e6c9
    style B fill:#fff9c4
    style G fill:#f8bbd0
    style K fill:#fff9c4
```

**Key Points:**
- Request handled at edge closest to user
- D1 database is centralized (request goes to DB region)
- KV cache is distributed (cache at each edge)
- Response returns from nearest edge location

### Express Request Flow (Traditional)

```mermaid
graph TD
    A["Client Request<br/>(HTTP)"] -->|Network| B["Load Balancer"]
    B -->|Distribute| C["Express Server 1"]
    B -->|Distribute| D["Express Server 2"]
    B -->|Distribute| E["Express Server N"]
    C -->|JWT Verify| F["Auth Middleware"]
    D -->|JWT Verify| F
    E -->|JWT Verify| F
    F -->|Extract Tenant| G["Tenant Middleware"]
    G -->|Cached Get| H["Redis Cache"]
    H -->|Miss| I["PostgreSQL Database"]
    I -->|Result| J["Service Layer"]
    J -->|File Ops| K["AWS S3 or Local Storage"]
    K -->|Response| L["JSON Response"]
    L -->|Cache Result| H
    H -->|Return to Client| M["Response to Client"]
    
    style A fill:#e1f5ff
    style M fill:#c8e6c9
    style B fill:#fff9c4
    style I fill:#f8bbd0
    style H fill:#fff9c4
```

**Key Points:**
- Multiple Express instances behind load balancer
- Redis provides in-process cache
- All instances access same PostgreSQL
- Horizontal scaling via more instances

## Plugin Lifecycle

### Plugin Installation & Activation

```mermaid
graph LR
    A["Plugin Registry<br/>(Available)"] -->|Install| B["Tenant Plugin<br/>(Inactive)"]
    B -->|Configure Settings| C["Plugin Config<br/>(in Database)"]
    C -->|Enable| D["Active Plugin<br/>(Running)"]
    D -->|Hooks| E["Hook Registry"]
    E -->|beforeProductCreate| F["Plugin Handler"]
    E -->|afterOrderCreate| G["Plugin Handler"]
    E -->|beforePayment| H["Plugin Handler"]
    F -->|Execution| I["Plugin Execution"]
    G -->|Execution| I
    H -->|Execution| I
    I -->|Disable| J["Inactive"]
    J -->|Uninstall| K["Removed"]
    
    style A fill:#e3f2fd
    style D fill:#c8e6c9
    style K fill:#ffcdd2
    style I fill:#fff9c4
```

### Plugin Execution Flow

```mermaid
graph TD
    A["Event Triggered<br/>(e.g., before_product_create)"] --> B["Load All Plugins<br/>for this event"]
    B --> C["Sort by Priority"]
    C --> D["Execute Plugin A<br/>(priority=5)"]
    D --> E{Success?}
    E -->|Yes| F["Result passed<br/>to next plugin"]
    E -->|No| G["Error Logged<br/>Execution stops"]
    F --> H["Execute Plugin B<br/>(priority=10)"]
    H --> I{Success?}
    I -->|Yes| J["Result passed<br/>to service layer"]
    I -->|No| K["Error Logged<br/>Execution stops"]
    J --> L["Continue Processing"]
    G --> L
    K --> L
    
    style A fill:#fff3e0
    style L fill:#c8e6c9
    style G fill:#ffcdd2
    style K fill:#ffcdd2
```

**Plugin Priority Order:**
- Priority 1, 5, 10, 20, etc. (lower = earlier)
- Each plugin receives output from previous
- Can modify or validate data
- Errors stop chain (for before hooks)

## UI Component Resolution

### Admin Dashboard Component Loading

```mermaid
graph TD
    A["Browser Request<br/>/admin/mystore"] --> B["Load React App"]
    B --> C["Fetch Tenant Config"]
    C --> D["Apply Theme/Branding"]
    D --> E["Load Navigation"]
    E --> F["Check Installed Plugins"]
    F --> G["Load Plugin Manifests"]
    G --> H["Build Menu Items"]
    H --> I["Render Sidebar"]
    I --> J["User Navigates to Page"]
    J --> K{Page Type?}
    K -->|Core Feature| L["Import shadcn/ui Component"]
    K -->|Plugin Feature| M["Dynamically Load Plugin Component"]
    L --> N["Render Component with Theme"]
    M --> N
    N --> O["Apply Tenant CSS Variables"]
    O --> P["Render in Browser"]
    
    style A fill:#e1f5ff
    style P fill:#c8e6c9
    style N fill:#fff9c4
```

### Plugin Component Mount

```mermaid
graph TD
    A["User Clicks Plugin Menu"] --> B["Get Plugin Component Path"]
    B --> C["Plugin Manifest:<br/>component=src/admin/Settings.tsx"]
    C --> D["Lazy Load Component"]
    D --> E["Component Imports shadcn/ui"]
    E --> F["shadcn/ui Imports Tailwind"]
    F --> G["Apply Tenant Theme<br/>CSS Variables"]
    G --> H["Render Plugin Component"]
    H --> I["Plugin UI Inherits Theme"]
    I --> J["Button colors from<br/>--primary variable"]
    J --> K["Form styling from<br/>--accent variable"]
    K --> L["Full branded plugin UI"]
    
    style A fill:#e1f5ff
    style L fill:#c8e6c9
    style I fill:#fff9c4
```

**Theme Variable Flow:**
```
Tenant Branding (Database)
    ↓
useTheme() Hook
    ↓
CSS Variables (--primary, --accent, etc.)
    ↓
Tailwind Classes
    ↓
Component Styling
```

## Data Flow Examples

### Product Creation with Plugins

```mermaid
sequenceDiagram
    participant Client
    participant API as Express/Hono
    participant PluginSys as Plugin System
    participant Service as Product Service
    participant DB as Database
    participant PluginA as Plugin A<br/>(Validation)
    participant PluginB as Plugin B<br/>(Transformation)
    participant PluginC as Plugin C<br/>(Enrichment)

    Client->>API: POST /products
    API->>PluginSys: before_product_create(data)
    PluginSys->>PluginA: Execute (priority=10)
    PluginA->>PluginA: Validate required fields
    PluginA-->>PluginSys: Return validated data
    PluginSys->>PluginB: Execute (priority=20)
    PluginB->>PluginB: Transform data
    PluginB-->>PluginSys: Return transformed data
    PluginSys->>PluginC: Execute (priority=30)
    PluginC->>PluginC: Enrich with defaults
    PluginC-->>PluginSys: Return enriched data
    PluginSys->>Service: Final data
    Service->>DB: INSERT product
    DB-->>Service: Created product
    PluginSys->>PluginA: after_product_create(product)
    PluginSys->>PluginB: after_product_create(product)
    PluginSys->>PluginC: after_product_create(product)
    Service->>Client: 201 Created
```

### Order Fulfillment Workflow

```mermaid
graph TD
    A["Order Created"] --> B["Order Status: pending"]
    B --> C["Payment Processed"]
    C --> D["Order Status: paid"]
    D --> E["Trigger Fulfillment Workflow"]
    E --> F["Workflow Step 1: Check Inventory"]
    F --> G{Stock Available?}
    G -->|No| H["Hold Order"]
    G -->|Yes| I["Workflow Step 2: Generate Keys"]
    I --> J["Call Key Generation Plugin"]
    J --> K["Keys Generated"]
    K --> L["Workflow Step 3: Send Delivery"]
    L --> M["Call Email Plugin"]
    M --> N["Email Sent to Customer"]
    N --> O["Order Status: fulfilled"]
    O --> P["Workflow Complete"]
    P --> Q["after_delivery Hook"]
    Q --> R["Analytics Plugin Logs Event"]
    
    style A fill:#fff3e0
    style P fill:#c8e6c9
    style H fill:#ffcdd2
    style E fill:#fff9c4
```

### Payment Processing with Gateway

```mermaid
sequenceDiagram
    participant Client
    participant API as Platform API
    participant PaymentPlugin as Payment Plugin<br/>(Stripe)
    participant Stripe as Stripe API
    participant DB as Database

    Client->>API: POST /checkout
    API->>PaymentPlugin: before_payment_process
    PaymentPlugin->>PaymentPlugin: Add metadata<br/>Add idempotency key
    PaymentPlugin-->>API: Modified payment data
    API->>Stripe: Create payment intent
    Stripe-->>API: payment_intent object
    API->>DB: Create order (pending)
    DB-->>API: Order ID
    API->>Client: Payment intent ID
    Client->>Stripe: Complete payment
    Stripe->>API: Webhook (payment_intent.succeeded)
    API->>PaymentPlugin: after_payment_success
    PaymentPlugin->>DB: Record transaction
    PaymentPlugin->>API: Send confirmation email
    API->>DB: Update order status (paid)
    API->>DB: Trigger fulfillment workflow
```

## Runtime Comparison

### Performance Characteristics

```mermaid
graph LR
    subgraph Express["Express Runtime"]
        A["Cold Start:<br/>~100ms"] 
        B["Avg Latency:<br/>50-200ms"]
        C["Memory:<br/>Varies"]
        D["Connections:<br/>Connection pool"]
        E["Scaling:<br/>Manual"]
    end
    
    subgraph Workers["Workers Runtime"]
        F["Cold Start:<br/>~1-5ms"]
        G["Avg Latency:<br/>10-50ms edge<br/>100-300ms w/ DB"]
        H["Memory:<br/>~128MB"]
        I["Connections:<br/>D1 limits"]
        J["Scaling:<br/>Automatic"]
    end
    
    style A fill:#bbdefb
    style F fill:#bbdefb
    style E fill:#fff9c4
    style J fill:#fff9c4
```

### Feature Comparison

```mermaid
graph TD
    subgraph Features["Core Features"]
        A["Multi-Tenancy"]
        B["Plugin System"]
        C["Product Types"]
        D["Workflows"]
        E["Payments"]
        F["Delivery"]
    end
    
    subgraph Express["Express ✓"]
        G["PostgreSQL"]
        H["Redis Cache"]
        I["S3 Storage"]
        J["Long-running ops"]
        K["File uploads"]
    end
    
    subgraph Workers["Workers ✓"]
        L["D1 SQLite"]
        M["KV Cache"]
        N["R2 Storage"]
        O["30s timeout"]
        P["Edge computing"]
    end
    
    A --> Express
    A --> Workers
    B --> Express
    B --> Workers
    C --> Express
    C --> Workers
    D --> Express
    D --> Workers
    E --> Express
    E --> Workers
    F --> Express
    F --> Workers
    
    style A fill:#c8e6c9
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#c8e6c9
    style E fill:#c8e6c9
    style F fill:#c8e6c9
```

## Deployment Architecture

### Express Deployment

```mermaid
graph TB
    subgraph Internet["Internet"]
        A["Users<br/>(worldwide)"]
    end
    
    subgraph DNS["DNS"]
        B["Route53 or<br/>CloudFlare DNS"]
    end
    
    subgraph CDN["CDN Layer<br/>(optional)"]
        C["CloudFront or<br/>Cloudflare CDN"]
    end
    
    subgraph AWS["AWS / Cloud"]
        D["Load Balancer<br/>(ALB/NLB)"]
        E["Express Server 1"]
        F["Express Server 2"]
        G["Express Server N"]
        H["PostgreSQL<br/>(RDS)"]
        I["Redis<br/>(ElastiCache)"]
        J["S3 Bucket"]
    end
    
    A -->|DNS Lookup| B
    B -->|Route| C
    C -->|HTTPS| D
    D -->|Route| E
    D -->|Route| F
    D -->|Route| G
    E -->|Query| H
    F -->|Query| H
    G -->|Query| H
    E -->|Cache| I
    F -->|Cache| I
    G -->|Cache| I
    E -->|Upload/Download| J
    F -->|Upload/Download| J
    G -->|Upload/Download| J
    
    style A fill:#e1f5ff
    style D fill:#fff9c4
    style H fill:#f8bbd0
```

### Workers Deployment

```mermaid
graph TB
    subgraph Internet["Internet"]
        A["Users<br/>(worldwide)"]
    end
    
    subgraph CF["Cloudflare Network"]
        B["Global Edge<br/>(200+ locations)"]
        C["Worker 1"]
        D["Worker 2"]
        E["Worker N"]
        F["KV Cache<br/>(Global)"]
        G["R2 Storage<br/>(Global)"]
    end
    
    subgraph CF_Central["Cloudflare Central"]
        H["D1 Database<br/>(Replicated)"]
        I["Analytics<br/>Engine"]
    end
    
    A -->|Nearest Edge| B
    B -->|Route| C
    B -->|Route| D
    B -->|Route| E
    C -->|Query| H
    D -->|Query| H
    E -->|Query| H
    C -->|Cache| F
    D -->|Cache| F
    E -->|Cache| F
    C -->|Storage| G
    D -->|Storage| G
    E -->|Storage| G
    C -->|Metrics| I
    D -->|Metrics| I
    E -->|Metrics| I
    
    style A fill:#e1f5ff
    style B fill:#fff9c4
    style H fill:#f8bbd0
    style F fill:#fff9c4
```

## Multi-Tenant Data Isolation

```mermaid
graph TD
    A["API Request"] -->|Extract from URL| B["Tenant Slug: 'store-a'"]
    B -->|Query Database| C["SELECT * FROM tenants<br/>WHERE slug = 'store-a'"]
    C -->|Get| D["Tenant ID: 123"]
    D -->|Attach to Context| E["ctx.tenantId = 123"]
    E -->|All Queries| F["WHERE tenant_id = 123"]
    F -->|Query| G["SELECT * FROM products<br/>WHERE tenant_id = 123"]
    G -->|Returns| H["Only Store A Products"]
    
    I["Store B User"] -->|Extract from URL| J["Tenant Slug: 'store-b'"]
    J -->|Query Database| K["SELECT * FROM tenants<br/>WHERE slug = 'store-b'"]
    K -->|Get| L["Tenant ID: 456"]
    L -->|Attach to Context| M["ctx.tenantId = 456"]
    M -->|All Queries| N["WHERE tenant_id = 456"]
    N -->|Query| O["SELECT * FROM products<br/>WHERE tenant_id = 456"]
    O -->|Returns| P["Only Store B Products"]
    
    H -->|No overlap| P
    
    style D fill:#c8e6c9
    style L fill:#c8e6c9
    style H fill:#e8f5e9
    style P fill:#e8f5e9
```

**Key Points:**
- Every row includes `tenant_id`
- Every query filters by `tenant_id`
- Zero possibility of cross-tenant data leakage
- Multi-tenant database on single PostgreSQL/D1

## References

For more details on each component:
- [Cloudflare Migration Guide](./cloudflare-migration.md) - Architecture details
- [Cloudflare Dev Setup](./cloudflare-dev-setup.md) - Runtime differences
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [Plugin Development Guide](./plugin-development.md) - Plugin architecture
