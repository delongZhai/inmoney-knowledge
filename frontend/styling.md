# Styling

TailwindCSS and DaisyUI conventions in InMoney.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| TailwindCSS | 4 | Utility-first CSS |
| DaisyUI | Latest | Component classes |

## TailwindCSS 4

InMoney uses TailwindCSS v4 with the new configuration format.

### Configuration
Configuration is in CSS rather than JavaScript:

```css
/* styles.css */
@import "tailwindcss";
@import "daisyui";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
}
```

## DaisyUI Components

### Buttons
```html
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>
```

### Cards
```html
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Forms
```html
<div class="form-control">
  <label class="label">
    <span class="label-text">Email</span>
  </label>
  <input type="email" class="input input-bordered" />
</div>
```

### Tables
```html
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Item</td>
      <td>$100</td>
    </tr>
  </tbody>
</table>
```

## Theming

### Theme Configuration
DaisyUI themes are configured in the Tailwind config.

### Dark Mode
```html
<html data-theme="dark">
```

### Theme Switching
```typescript
document.documentElement.setAttribute('data-theme', 'dark');
```

## Layout Patterns

### Flexbox
```html
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Container
```html
<div class="container mx-auto px-4">
  Content
</div>
```

## Responsive Design

### Breakpoints
| Prefix | Min Width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Usage
```html
<div class="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

## Best Practices

### Do
- Use utility classes directly
- Use DaisyUI semantic classes for components
- Keep custom CSS minimal
- Use responsive prefixes

### Don't
- Create custom utility classes unnecessarily
- Mix utility and custom CSS
- Hardcode colors (use theme variables)
- Ignore mobile-first approach
