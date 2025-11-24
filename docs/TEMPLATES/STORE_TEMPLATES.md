# UI Theming with shadcn/ui

Complete guide to customizing the admin dashboard appearance using shadcn/ui components, theming system, and plugin UI extensions.

## Table of Contents

1. [Overview](#overview)
2. [shadcn/ui Setup](#shadcnui-setup)
3. [Theming System](#theming-system)
4. [Component Library](#component-library)
5. [Customization](#customization)
6. [Plugin UI Integration](#plugin-ui-integration)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)

## Overview

The admin dashboard uses **shadcn/ui** - a collection of beautiful, accessible React components built on top of Radix UI and Tailwind CSS.

### Why shadcn/ui?

✅ **Unstyled, accessible components** - Built on Radix UI primitives
✅ **Tailwind CSS** - Utility-first styling
✅ **Copy-paste approach** - Full control, no vendor lock-in
✅ **Dark mode support** - Built-in light/dark theming
✅ **TypeScript** - Full type safety
✅ **Customizable** - Modify components to fit your brand

## shadcn/ui Setup

### Installation

```bash
# shadcn/ui is already installed in the project
npm list shadcn/ui

# For new components, use the CLI
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
```

### File Structure

```
src/
├── admin-ui/                          # Admin dashboard (React)
│   ├── components/
│   │   └── ui/                        # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ...
│   ├── lib/
│   │   └── utils.ts                   # Tailwind class utilities
│   └── pages/
│       ├── products/
│       ├── orders/
│       └── plugins/
└── styles/
    └── globals.css                    # Global styles & theme
```

### Configuration Files

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.6%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 9.0%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --primary: 0 0% 9.0%;
    --primary-foreground: 0 0% 98%;
    --ring: 0 0% 3.6%;
  }

  .dark {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.6%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.6%;
    --popover-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 98%;
    --accent-foreground: 0 0% 9.0%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9.0%;
    --ring: 0 0% 83.3%;
  }
}
```

## Theming System

### Color Schemes

The platform supports multiple built-in color schemes:

#### Light Theme
```css
--primary: 0 0% 9.0%;           /* Near black */
--primary-foreground: 0 0% 98%; /* Near white */
--background: 0 0% 100%;        /* White */
--foreground: 0 0% 3.6%;        /* Dark gray */
--accent: 0 0% 9.0%;            /* Same as primary */
--destructive: 0 84.2% 60.2%;   /* Red */
```

#### Dark Theme
```css
--primary: 0 0% 98%;            /* Near white */
--primary-foreground: 0 0% 9.0%;/* Near black */
--background: 0 0% 3.6%;        /* Very dark gray */
--foreground: 0 0% 98%;         /* Light gray */
--accent: 0 0% 98%;             /* Same as primary */
--destructive: 0 62.8% 30.6%;   /* Darker red */
```

### Tenant Branding

Each tenant can have custom branding stored in the database:

```typescript
// Tenant branding structure
interface TenantBranding {
  logo_url: string;
  favicon_url: string;
  primary_color: string;        // Hex: #3b82f6
  secondary_color: string;      // Hex: #1f2937
  accent_color: string;         // Hex: #f59e0b
  background_color: string;
  text_color: string;
  theme: 'light' | 'dark';
  font_family: string;
  custom_css: string;           // Custom CSS rules
}
```

### Applying Custom Theme

```typescript
// src/admin-ui/hooks/useTheme.ts
import { useEffect } from 'react';
import { useStore } from './useStore';

export function useTheme() {
  const { tenant } = useStore();

  useEffect(() => {
    if (!tenant?.branding) return;

    // Set CSS variables for custom colors
    const root = document.documentElement;
    const branding = tenant.branding;

    // Convert hex to HSL
    const primaryHsl = hexToHsl(branding.primary_color);
    root.style.setProperty('--primary', primaryHsl);

    const secondaryHsl = hexToHsl(branding.secondary_color);
    root.style.setProperty('--accent', secondaryHsl);

    // Set theme class
    if (branding.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom CSS
    if (branding.custom_css) {
      const style = document.createElement('style');
      style.innerHTML = branding.custom_css;
      document.head.appendChild(style);
    }

    // Apply font family
    if (branding.font_family) {
      root.style.setProperty('--font-family', branding.font_family);
    }
  }, [tenant?.branding]);
}

function hexToHsl(hex: string): string {
  // Convert #3b82f6 to "210 100% 50%"
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
```

## Component Library

### Common Components

#### Button

```typescript
import { Button } from '@/components/ui/button';

export function ButtonDemo() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Disabled</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}
```

#### Card

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
    </Card>
  );
}
```

#### Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof formSchema>;

export function FormDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: FormValues) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>Your full name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

#### Table

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>${product.price.toFixed(2)}</TableCell>
            <TableCell>{product.stock}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### Dialog

```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Customization

### Creating Custom Components

```typescript
// src/admin-ui/components/ProductCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  name: string;
  price: number;
  status: 'active' | 'inactive';
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({
  name,
  price,
  status,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">${price.toFixed(2)}</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Extending Tailwind Classes

**lib/utils.ts:**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes properly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom utility classes
export const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

export const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4',
  sidebar: 'w-64 bg-card border-r border-border',
  main: 'flex-1 overflow-auto',
};
```

### Global Styles Override

**globals.css:**
```css
/* Override component defaults */
@layer components {
  .btn-custom {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .card-custom {
    @apply bg-card border border-border rounded-lg p-6;
  }

  .badge-custom {
    @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
  }
}
```

## Plugin UI Integration

### Register Plugin Components

```typescript
// src/admin-ui/types/plugin.ts
export interface PluginUIComponent {
  label: string;
  path: string;
  component: React.ComponentType;
  icon?: React.ComponentType;
}

// Plugin registers menu items via manifest
export interface PluginMenuItem {
  label: string;
  path: string;
  component: string; // Path to component file
  icon: string; // Icon name or component path
}
```

### Load Plugin Components Dynamically

```typescript
// src/admin-ui/components/PluginPage.tsx
import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';

export function PluginPage() {
  const { pluginSlug, path } = useParams();

  // Dynamically load plugin component
  const PluginComponent = lazy(
    () => import(`../../../plugins/${pluginSlug}/admin/${path}.tsx`)
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PluginComponent />
    </Suspense>
  );
}
```

### Styling Plugin Components

```typescript
// Plugin uses same shadcn/ui components for consistency
// src/admin-ui/plugins/my-plugin/Settings.tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  // Components automatically match tenant branding
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugin Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form with consistent styling */}
      </CardContent>
    </Card>
  );
}
```

## Responsive Design

### Breakpoints

```typescript
// Tailwind default breakpoints (mobile-first)
const breakpoints = {
  sm: '640px',   // Small phones
  md: '768px',   // Tablets
  lg: '1024px',  // Large tablets
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
};
```

### Responsive Layout

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function ResponsiveLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative
          w-64 bg-card border-r border-border
          md:w-auto md:max-w-xs lg:max-w-sm
          h-full
          transition-all duration-300
          ${mobileMenuOpen ? 'left-0' : '-left-64 md:left-0'}
        `}
      >
        {/* Sidebar content */}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile menu toggle */}
        <div className="md:hidden p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Responsive grid */}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Mobile-First CSS

```css
/* Mobile first - define mobile styles first */
.container {
  @apply w-full px-4;
}

/* Then add larger breakpoints */
@media (min-width: 768px) {
  .container {
    @apply max-w-2xl mx-auto px-6;
  }
}

@media (min-width: 1024px) {
  .container {
    @apply max-w-4xl mx-auto px-8;
  }
}
```

## Accessibility

### ARIA Labels

```typescript
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function CloseButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Close dialog"
      className="absolute right-4 top-4"
    >
      <X className="w-4 h-4" />
    </Button>
  );
}
```

### Keyboard Navigation

shadcn/ui components handle keyboard navigation automatically:

```typescript
// Tabs with keyboard support
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AccessibleTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      {/* Use arrow keys to navigate, Enter/Space to select */}
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );
}
```

### Form Validation Accessibility

```typescript
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function AccessibleForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <input
                id="email"
                type="email"
                aria-invalid={!!error}
                aria-describedby={error ? 'email-error' : undefined}
                {...field}
              />
              {error && (
                <FormMessage id="email-error">{error.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## Dark Mode Implementation

### Using Next.js (if applicable)

```typescript
// pages/_app.tsx
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');

    // Or read from tenant branding
    // setTheme(tenant.branding.theme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <Component {...pageProps} />;
}
```

## Best Practices

1. **Use semantic HTML**: Always use proper HTML elements
2. **Follow shadcn/ui patterns**: Use existing components as examples
3. **Maintain consistency**: Use the same components across pages
4. **Mobile-first**: Design mobile first, then enhance for larger screens
5. **Test accessibility**: Use tools like axe DevTools
6. **Document custom components**: Include JSDoc comments
7. **Avoid inline styles**: Use Tailwind classes
8. **Use color variables**: Reference CSS variables instead of hardcoding colors

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Lucide Icons](https://lucide.dev/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
