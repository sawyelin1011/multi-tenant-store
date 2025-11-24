# Templates Documentation

Welcome to the template system documentation for MTC Platform. This section contains comprehensive guides for creating and customizing store and product templates.

## 📚 Template Documentation

### [Store Templates](./STORE_TEMPLATES.md)
Complete guide to store customization:
- UI theming with shadcn/ui
- Component customization
- Layout configuration
- Branding guidelines
- Responsive design
- Accessibility features

### [Product Templates](./PRODUCT_TEMPLATES.md)
Product type definition and templates:
- Dynamic product types
- Custom field definitions
- Product variant templates
- Category templates
- Pricing templates
- Template inheritance

## 🎨 Template System Overview

### What are Templates?

Templates in MTC Platform allow you to:

- **Customize Store Appearance**: Themes, layouts, branding
- **Define Product Types**: Dynamic schemas for different products
- **Create Workflows**: Custom business processes
- **Configure Experiences**: Tailored user journeys

### Template Types

#### 1. Store Templates

Control the visual appearance and layout of stores:

```json
{
  "name": "Modern E-commerce",
  "version": "1.0.0",
  "description": "Clean, modern e-commerce design",
  "features": [
    "responsive-design",
    "dark-mode",
    "minimal-ui"
  ],
  "components": {
    "header": "modern-header",
    "product-grid": "masonry-grid",
    "checkout": "multi-step-checkout"
  },
  "theme": {
    "primary_color": "#3b82f6",
    "secondary_color": "#64748b",
    "font_family": "Inter",
    "border_radius": "8px"
  }
}
```

#### 2. Product Type Templates

Define the structure and behavior of different product types:

```json
{
  "slug": "digital-course",
  "name": "Online Course",
  "description": "Digital course with video content",
  "schema": {
    "fields": [
      {
        "name": "title",
        "type": "text",
        "label": "Course Title",
        "required": true,
        "validation": {
          "minLength": 3,
          "maxLength": 200
        }
      },
      {
        "name": "description",
        "type": "richtext",
        "label": "Course Description",
        "required": true
      },
      {
        "name": "duration_hours",
        "type": "number",
        "label": "Duration (Hours)",
        "required": true,
        "min": 0.5,
        "max": 1000
      },
      {
        "name": "video_files",
        "type": "file",
        "label": "Course Videos",
        "multiple": true,
        "accept": ["video/mp4", "video/webm"]
      }
    ]
  },
  "workflows": [
    "course-enrollment",
    "progress-tracking",
    "certificate-generation"
  ]
}
```

## 🚀 Quick Start

### Create a Store Template

1. **Define Template Structure**:
```json
{
  "name": "My Custom Theme",
  "components": {
    "header": "custom-header",
    "footer": "custom-footer"
  }
}
```

2. **Create Components**:
```jsx
// components/custom-header.jsx
import React from 'react';

export default function CustomHeader({ store, user }) {
  return (
    <header className="custom-header">
      <h1>{store.name}</h1>
      <nav>
        <a href="/products">Products</a>
        <a href="/about">About</a>
      </nav>
      {user && <div>Welcome, {user.name}</div>}
    </header>
  );
}
```

3. **Apply Template**:
```bash
curl -X POST http://localhost:3000/api/stores/template \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_123",
    "template": "my-custom-theme"
  }'
```

### Create a Product Type Template

1. **Define Product Schema**:
```json
{
  "slug": "software-license",
  "name": "Software License",
  "schema": {
    "fields": [
      {
        "name": "product_name",
        "type": "text",
        "label": "Product Name",
        "required": true
      },
      {
        "name": "license_key",
        "type": "text",
        "label": "License Key",
        "generated": true
      },
      {
        "name": "download_url",
        "type": "url",
        "label": "Download URL",
        "required": true
      }
    ]
  }
}
```

2. **Register Product Type**:
```bash
curl -X POST http://localhost:3000/api/product-types \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store_123",
    "product_type": "software-license"
  }'
```

## 🎯 Template Features

### Theme Customization

#### Color Schemes

```json
{
  "theme": {
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#64748b",
      "accent": "#f59e0b",
      "background": "#ffffff",
      "surface": "#f8fafc",
      "text": "#1e293b"
    },
    "dark_mode": {
      "primary": "#60a5fa",
      "secondary": "#94a3b8",
      "background": "#0f172a",
      "surface": "#1e293b",
      "text": "#f1f5f9"
    }
  }
}
```

#### Typography

```json
{
  "typography": {
    "font_family": {
      "primary": "Inter",
      "secondary": "Georgia",
      "mono": "JetBrains Mono"
    },
    "font_sizes": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem"
    },
    "font_weights": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  }
}
```

### Layout Configuration

#### Component Structure

```json
{
  "layout": {
    "header": {
      "component": "store-header",
      "props": {
        "show_search": true,
        "show_cart": true,
        "sticky": true
      }
    },
    "navigation": {
      "component": "main-navigation",
      "props": {
        "style": "horizontal",
        "dropdown": true,
        "mobile_menu": true
      }
    },
    "content": {
      "component": "main-content",
      "props": {
        "max_width": "1200px",
        "padding": "2rem"
      }
    },
    "sidebar": {
      "component": "product-filters",
      "props": {
        "collapsible": true,
        "sticky": true
      }
    },
    "footer": {
      "component": "store-footer",
      "props": {
        "columns": 4,
        "show_newsletter": true
      }
    }
  }
}
```

#### Responsive Breakpoints

```json
{
  "breakpoints": {
    "mobile": "640px",
    "tablet": "768px",
    "desktop": "1024px",
    "wide": "1280px"
  },
  "grid": {
    "columns": {
      "mobile": 1,
      "tablet": 2,
      "desktop": 3,
      "wide": 4
    },
    "gap": "1rem"
  }
}
```

### Product Type Features

#### Field Types

```json
{
  "field_types": {
    "text": {
      "component": "text-input",
      "validation": ["required", "minLength", "maxLength"]
    },
    "richtext": {
      "component": "rich-text-editor",
      "validation": ["required", "minLength"]
    },
    "number": {
      "component": "number-input",
      "validation": ["required", "min", "max"]
    },
    "select": {
      "component": "select-dropdown",
      "validation": ["required"],
      "options": ["option1", "option2"]
    },
    "file": {
      "component": "file-upload",
      "validation": ["required", "fileType", "fileSize"],
      "accept": ["image/*", "application/pdf"]
    },
    "date": {
      "component": "date-picker",
      "validation": ["required", "minDate", "maxDate"]
    },
    "boolean": {
      "component": "checkbox",
      "validation": []
    }
  }
}
```

#### Validation Rules

```json
{
  "validation": {
    "required": {
      "message": "This field is required",
      "rule": "value !== null && value !== undefined && value !== ''"
    },
    "minLength": {
      "message": "Minimum length is {min} characters",
      "rule": "value.length >= min"
    },
    "maxLength": {
      "message": "Maximum length is {max} characters",
      "rule": "value.length <= max"
    },
    "min": {
      "message": "Minimum value is {min}",
      "rule": "parseFloat(value) >= min"
    },
    "max": {
      "message": "Maximum value is {max}",
      "rule": "parseFloat(value) <= max"
    },
    "email": {
      "message": "Please enter a valid email address",
      "rule": /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    "url": {
      "message": "Please enter a valid URL",
      "rule": /^https?:\/\/.+/
    }
  }
}
```

## 🔧 Template Development

### File Structure

```
my-template/
├── template.json              # Template manifest
├── components/                # React components
│   ├── header/
│   │   ├── index.jsx
│   │   └── styles.css
│   ├── product-card/
│   │   ├── index.jsx
│   │   └── styles.css
│   └── checkout/
│       ├── index.jsx
│       └── styles.css
├── assets/                   # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── styles/                   # Global styles
│   ├── variables.css
│   ├── components.css
│   └── utilities.css
├── scripts/                  # JavaScript utilities
│   ├── utils.js
│   └── animations.js
└── README.md                 # Template documentation
```

### Template Manifest

```json
{
  "name": "modern-store",
  "version": "1.0.0",
  "description": "Modern, responsive store template",
  "author": "Template Author",
  "license": "MIT",
  "preview": "preview.jpg",
  "tags": ["modern", "responsive", "minimal"],
  "compatibility": {
    "platform_version": ">=1.0.0",
    "browsers": ["chrome>=90", "firefox>=88", "safari>=14"]
  },
  "dependencies": {
    "react": "^18.0.0",
    "tailwindcss": "^3.0.0"
  },
  "theme": {
    "default_colors": {
      "primary": "#3b82f6",
      "secondary": "#64748b"
    },
    "customizable": true
  },
  "components": {
    "header": {
      "component": "modern-header",
      "configurable": true,
      "props": {
        "show_search": true,
        "show_cart": true,
        "sticky": false
      }
    }
  }
}
```

### Component Development

```jsx
// components/product-card/index.jsx
import React from 'react';
import './styles.css';

export default function ProductCard({ product, theme, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price">${product.price}</div>
        
        <button 
          className="add-to-cart-btn"
          style={{ backgroundColor: theme.primary_color }}
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

```css
/* components/product-card/styles.css */
.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.product-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
  margin-bottom: 1rem;
}

.add-to-cart-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
```

## 📦 Template Installation

### From Template Directory

```bash
# Install template locally
npm run template:install ./my-template

# Apply to store
npm run template:apply my-template --store=store_123
```

### From Template Registry

```bash
# Install from registry
npm run template:install modern-store

# Configure template
npm run template:configure modern-store --store=store_123
```

### Template Configuration

```bash
curl -X POST http://localhost:3000/api/templates/configure \
  -H "x-api-key: sk_test_admin123456" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "modern-store",
    "store_id": "store_123",
    "config": {
      "theme": {
        "primary_color": "#3b82f6",
        "secondary_color": "#64748b"
      },
      "components": {
        "header": {
          "show_search": true,
          "sticky": true
        }
      }
    }
  }'
```

## 🎨 Template Customization

### Theme Variables

```css
/* styles/variables.css */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1e293b;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-secondary: 'Georgia', serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;
    --color-secondary: #94a3b8;
    --color-background: #0f172a;
    --color-surface: #1e293b;
    --color-text: #f1f5f9;
  }
}
```

### Component Overrides

```jsx
// components/custom-product-card.jsx
import ProductCard from './product-card';

export default function CustomProductCard(props) {
  const customStyles = {
    card: {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-lg)'
    },
    title: {
      fontFamily: 'var(--font-primary)',
      fontSize: '1.25rem',
      fontWeight: '600'
    }
  };

  return (
    <ProductCard 
      {...props}
      styles={customStyles}
    />
  );
}
```

## 📚 Template Examples

### E-commerce Store Template

Modern e-commerce template with:
- Responsive design
- Product filtering
- Shopping cart
- Checkout flow
- User accounts

### Digital Products Store

Template optimized for digital products:
- File downloads
- License management
- Customer dashboard
- Instant delivery
- API access

### Service Booking Template

Template for service-based businesses:
- Booking calendar
- Service scheduling
- Staff management
- Payment processing
- Notification system

### Community Marketplace

Template for multi-vendor marketplaces:
- Vendor profiles
- Product listings
- Review system
- Commission tracking
- Dispute resolution

## 🔍 Template Testing

### Unit Testing

```jsx
// components/product-card/product-card.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './index';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 29.99,
    image: 'test.jpg'
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Integration Testing

```jsx
// templates/integration.test.jsx
import { render } from '@testing-library/react';
import StoreTemplate from './modern-store';

describe('Store Template', () => {
  it('renders complete store layout', () => {
    const mockStore = {
      name: 'Test Store',
      products: [mockProduct]
    };

    render(<StoreTemplate store={mockStore} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

## 📋 Template Guidelines

### Design Principles

1. **Responsive First**: Design for mobile first, then scale up
2. **Accessibility**: Follow WCAG 2.1 AA guidelines
3. **Performance**: Optimize for fast loading times
4. **Consistency**: Use consistent design patterns
5. **Flexibility**: Make components customizable

### Code Standards

1. **Component Structure**: Use functional components with hooks
2. **CSS Organization**: Use CSS modules or styled-components
3. **File Naming**: Use kebab-case for files
4. **Props Documentation**: Document all component props
5. **Error Handling**: Handle edge cases gracefully

### Performance Guidelines

1. **Image Optimization**: Use modern image formats
2. **Code Splitting**: Lazy load components when possible
3. **Bundle Size**: Keep JavaScript bundles small
4. **Caching**: Implement proper caching strategies
5. **CDN**: Use CDN for static assets

## 🌟 Template Marketplace

### Featured Templates

- **Modern Minimal**: Clean, minimalist design
- **Bold & Bright**: Vibrant colors and typography
- **Professional**: Business-focused template
- **Creative**: Artistic and unique layouts
- **Tech Dark**: Dark theme for tech products

### Template Ratings

- **User Reviews**: Community feedback
- **Performance Scores**: Speed and optimization
- **Accessibility Rating**: WCAG compliance score
- **Mobile Friendliness**: Responsive design score
- **Update Frequency**: Regular maintenance

## 📚 Additional Resources

### Documentation

- [Store Templates](./STORE_TEMPLATES.md) - Detailed store customization
- [Product Templates](./PRODUCT_TEMPLATES.md) - Product type definitions
- [Component Library](../DEVELOPMENT/ARCHITECTURE.md) - Available components

### Tools

- **Template CLI**: Command-line tools for template development
- **Template Generator**: Scaffold new templates quickly
- **Design System**: Component library and design tokens
- **Preview Tool**: Live template preview and testing

### Community

- **Template Showcase**: Share your templates
- **Design Forum**: Discuss design patterns
- **Contributor Guide**: Contribute to template system
- **Support**: Get help with template development

## 🤝 Getting Help

### Common Issues

1. **Template not loading**: Check manifest syntax
2. **Styles not applying**: Verify CSS imports
3. **Components not rendering**: Check React exports
4. **Responsive issues**: Test on different screen sizes

### Support Channels

- **Documentation**: Check these guides first
- **GitHub Issues**: Report template bugs
- **Design Forum**: Ask design questions
- **Discord/Slack**: Real-time template help

---

**Template System Version**: 2.0.0  
**Last Updated**: 2024-11-24  
**Platform Compatibility**: v1.0.0+

For detailed template development information, see the specific guides above.