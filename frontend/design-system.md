# InMoney Design System

Comprehensive UI/UX documentation for the InMoney frontend.

## Overview

InMoney uses a **data-focused, trading-oriented design** built on:
- **TailwindCSS 4** - Utility-first CSS framework
- **DaisyUI** - Component library with theming
- **Material Icons** - Icon system
- **ApexCharts** - Data visualization

**Design Philosophy**:
- Information density over whitespace (traders need data)
- Semantic color coding (green = bullish, red = bearish)
- Keyboard-first navigation for power users
- Focus mode for deep analysis

---

## Color System

### Theme Configuration

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

### Semantic Colors

| Color | Usage | CSS Class |
|-------|-------|-----------|
| **Primary** | Links, selected states, focus mode | `text-primary`, `bg-primary`, `btn-primary` |
| **Success (Green)** | Bullish, calls, positive change | `text-green-500`, `bg-success/10`, `.bullish` |
| **Error (Red)** | Bearish, puts, negative change | `text-red-500`, `bg-error/10`, `.bearish` |
| **Info (Blue)** | Informational, prices | `text-info` |
| **Base-100** | Primary background | `bg-base-100` |
| **Base-200** | Secondary background, cards | `bg-base-200` |
| **Base-300** | Tertiary, hover states | `bg-base-300` |

### Trading Colors

```css
/* Bullish (positive) */
div.bullish { @apply bg-green-500 text-white; }
p.bullish { @apply text-green-500; }

/* Bearish (negative) */
div.bearish { @apply bg-red-500 text-white; }
p.bearish { @apply text-red-500; }

/* Selected option in chain */
.selected-option { @apply bg-primary-content text-primary; }
```

### Gradient (Branding)

```css
.bg-gradient {
  background-image: linear-gradient(
    45deg,
    rgb(112, 209, 239) 0%,    /* Cyan */
    rgb(236, 160, 255) 100%   /* Pink/Magenta */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Typography

### Font Stack

```css
font-family: Roboto, 'Helvetica Neue', sans-serif;
```

### Heading Scale

| Level | Classes | Usage |
|-------|---------|-------|
| H1 | `text-5xl font-bold` | Page titles |
| H2 | `text-4xl font-bold` | Section headers |
| H3 | `text-3xl font-bold` | Card titles |
| H4 | `text-2xl font-semibold` | Subsections |
| H5 | `text-xl font-semibold` | Labels |
| H6 | `text-lg font-semibold` | Small labels |

### Body Text

- Default: `text-base` (16px)
- Small: `text-sm` (14px)
- Extra small: `text-xs` (12px)
- Large: `text-lg` (18px)

### Icons

```html
<!-- Material Symbols (outlined) -->
<span class="material-symbols-outlined size-6">explore</span>

<!-- Sizes -->
<span class="material-symbols-outlined size-4">icon</span>  <!-- 16px -->
<span class="material-symbols-outlined size-5">icon</span>  <!-- 20px -->
<span class="material-symbols-outlined size-6">icon</span>  <!-- 24px -->
```

---

## Layout System

### Dashboard Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header (sticky)                                        │
│  ┌─────┬────────────────────────────────┬─────────────┐ │
│  │     │                                │             │ │
│  │ S   │      Main Content              │  Sideview   │ │
│  │ i   │      (router-outlet)           │  (analysis) │ │
│  │ d   │                                │             │ │
│  │ e   │                                │             │ │
│  │ b   │                                │             │ │
│  │ a   │                                │             │ │
│  │ r   │                                │             │ │
│  │     │                                │             │ │
│  └─────┴────────────────────────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Default | < 768px | Mobile, horizontal menu, full width |
| md | 768px | Tablet, grid layout |
| lg | 1024px | Desktop, sidebar visible, `max-w-5xl` |
| xl | 1280px | Large desktop, `max-w-6xl` |
| 2xl | 1536px | Extra large, `max-w-7xl` |

### Container Widths

```html
<!-- Default (sideview closed) -->
<div class="lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">

<!-- Sideview open -->
<div class="min-lg:max-w-11/12">
```

### Grid System

```css
.grid .full-col-span { @apply col-span-full; }    /* 12 columns */
.grid .third-col-span { @apply col-span-9; }      /* 9 columns */
.grid .half-col-span { @apply col-span-6; }       /* 6 columns */
.grid .quarter-col-span { @apply col-span-3; }    /* 3 columns */
```

---

## Components

### Buttons

```html
<!-- Primary (main actions) -->
<button class="btn btn-primary">
  <span class="material-symbols-outlined size-6">add</span>
  Add to Watchlist
</button>

<!-- Neutral (secondary actions) -->
<button class="btn btn-neutral">Analyze</button>

<!-- Ghost (icon buttons, subtle actions) -->
<button class="btn btn-ghost btn-circle">
  <span class="material-symbols-outlined">settings</span>
</button>

<!-- Outline -->
<button class="btn btn-outline border-primary text-primary">Login</button>

<!-- Small -->
<button class="btn btn-sm">Small Button</button>

<!-- With loading -->
<button class="btn btn-primary" [class.loading]="isLoading">Submit</button>
```

### Cards

```html
<!-- Data card -->
<div class="card card-border bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer">
  <div class="card-body">
    <h4 class="card-title">AAPL</h4>
    <p class="text-lg bullish">$150.25</p>
  </div>
</div>

<!-- Pricing card -->
<div class="rounded-3xl bg-white p-10 shadow-lg">
  <h2 class="font-mono text-xs uppercase tracking-widest">Plan Name</h2>
  <div class="text-5xl font-medium">$20</div>
  <ul class="mt-8 space-y-4">
    <li class="flex items-center gap-3">
      <span class="material-symbols-outlined text-success">check</span>
      Feature description
    </li>
  </ul>
</div>
```

### Forms

```html
<!-- Text input -->
<label class="block text-sm font-medium text-gray-900">
  Email
</label>
<input
  type="text"
  class="block w-full rounded-md border-0 py-1.5 text-gray-900
         shadow-sm ring-1 ring-inset ring-gray-300
         placeholder:text-gray-400
         focus:ring-2 focus:ring-inset focus:ring-indigo-600"
/>

<!-- Checkbox -->
<div class="flex items-center gap-2">
  <input type="checkbox" class="checkbox" />
  <label class="text-sm font-medium">Remember me</label>
</div>

<!-- Select -->
<select class="select select-bordered w-full">
  <option>Option 1</option>
</select>
```

### Tables

```html
<!-- Options chain table -->
<table class="table table-pin-rows">
  <thead>
    <tr class="text-sm sticky top-0 z-30 bg-base-100">
      <th class="bg-success/10 text-center">Calls</th>
      <th class="bg-base-200 text-center">Strike</th>
      <th class="bg-error/10 text-center">Puts</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><!-- Call data --></td>
      <td class="text-center font-bold">$150</td>
      <td><!-- Put data --></td>
    </tr>
  </tbody>
</table>
```

### Stats Display

```html
<div class="stats stats-vertical w-full">
  <div class="stat">
    <div class="stat-title">Mark Price</div>
    <div class="stat-value text-info text-xl">$2.45</div>
    <div class="stat-desc">Bid: $2.40 - Ask: $2.50</div>
  </div>
</div>
```

### Badges

```html
<!-- Indicator badge -->
<span class="indicator-item badge badge-primary badge-sm">5</span>

<!-- Call/Put badge -->
<div class="badge badge-outline badge-success">CALL</div>
<div class="badge badge-outline badge-error">PUT</div>

<!-- Status badge -->
<div class="badge badge-info">Active</div>
```

### Menus & Dropdowns

```html
<!-- Dropdown menu -->
<div class="dropdown dropdown-end">
  <button class="btn btn-ghost btn-circle avatar">
    <img src="avatar.png" class="w-10 rounded-full" />
  </button>
  <ul class="dropdown-content bg-base-100 rounded-box w-52 shadow-lg">
    <li><a>Profile</a></li>
    <li><a>Settings</a></li>
    <li><a>Logout</a></li>
  </ul>
</div>

<!-- Context menu -->
<ul class="menu bg-primary-content rounded-box w-96 menu-sm" cdkMenu>
  <li cdkMenuItem>
    <button class="flex flex-row">
      <span class="material-symbols-outlined">add</span>
      <span class="grow px-4">Add to Watchlist</span>
    </button>
  </li>
  <li><h3 class="menu-title">Section Title</h3></li>
</ul>
```

---

## Navigation

### Sidebar

```html
<ul class="menu menu-horizontal lg:menu-vertical items-center
           bg-base-200 rounded-box max-w-20 sticky top-24 shadow-md"
    [ngClass]="{'bg-primary text-white': isInFocusMode()}">

  <li class="m-1 flex items-center w-12">
    <button class="btn btn-ghost w-full flex indicator"
            [class.btn-active]="isActive">
      <span class="material-symbols-outlined size-6">explore</span>
      <!-- Badge indicator -->
      <span class="indicator-item badge badge-primary badge-sm">3</span>
    </button>
  </li>
</ul>
```

### Focus Mode

When focus mode is active:
- Sidebar background turns `bg-primary`
- Text turns white
- User is locked to analyzing a single symbol
- Toggle with lock/unlock icon

```html
<label class="swap">
  <input type="checkbox" [checked]="isInFocusMode()" />
  <div class="swap-on">🔒</div>
  <div class="swap-off">🔓</div>
</label>
```

---

## Data Visualization

### Charts (ApexCharts)

```html
@defer (on idle) {
  <apx-chart
    [series]="series()"
    [chart]="{ type: 'line', height: 350 }"
    [xaxis]="xaxis()"
    [yaxis]="yaxis()"
  />
} @placeholder {
  <div class="min-h-[200px] w-full skeleton"></div>
}
```

### Price Display

```html
<!-- With color coding -->
<p class="text-lg"
   [class.bullish]="changePercent >= 0"
   [class.bearish]="changePercent < 0">
  {{ price | currency }}
</p>

<p [class.text-green-500]="change > 0"
   [class.text-red-500]="change < 0">
  {{ change | percent:'1.2-2' }}
</p>
```

### Number Formatting

```html
<!-- Currency -->
{{ value | currency }}              <!-- $1,234.56 -->
{{ value | currency:'USD':'symbol':'1.0-0' }}  <!-- $1,235 -->

<!-- Large numbers -->
{{ value | appShortFormCurrency }}  <!-- 1.2M, 500K -->

<!-- Percentage -->
{{ value | percent:'1.2-2' }}       <!-- 12.34% -->
```

---

## States

### Loading

```html
<!-- Skeleton loader -->
<div class="flex flex-col gap-4 w-full p-4">
  <div class="skeleton h-32 w-full"></div>
  <div class="skeleton h-4 w-28"></div>
  <div class="skeleton h-4 w-full"></div>
</div>

<!-- Toolbar skeleton -->
<div class="flex flex-row gap-4 p-2">
  <div class="skeleton h-10 w-24" *appRange="4"></div>
</div>

<!-- Button loading -->
<button class="btn loading">Loading...</button>
```

### Empty State

```html
<div class="card grid min-h-full place-items-center px-6 py-24">
  <div class="text-center">
    <p class="text-base font-semibold text-accent">No Data</p>
    <h1 class="mt-4 text-5xl font-semibold">Nothing to show</h1>
    <p class="mt-6 text-lg text-gray-500">
      Try adjusting your filters or adding symbols to your watchlist.
    </p>
    <div class="mt-10">
      <button class="btn btn-primary">Add Symbols</button>
    </div>
  </div>
</div>
```

### Toast Notifications

```css
.snackbar-position-top {
  @apply m-0 absolute right-6 top-32 rounded-lg;
}
.toast-success { @apply bg-success; }
.toast-error { @apply bg-error; }
.toast-info { @apply bg-info; }
.toast-warning { @apply bg-warning; }
```

---

## Spacing & Sizing

### Common Spacing

| Class | Size | Usage |
|-------|------|-------|
| `gap-2` | 8px | Tight spacing |
| `gap-4` | 16px | Default spacing |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Large spacing |
| `px-4 py-2` | | Button padding |
| `p-6` | 24px | Card padding |

### Common Sizes

| Class | Usage |
|-------|-------|
| `w-12` | Sidebar icon button |
| `w-20` | Sidebar width |
| `w-52` | Dropdown width |
| `w-96` | Context menu width |
| `min-h-[200px]` | Chart minimum height |
| `h-screen` | Full viewport height |

---

## Shadows & Borders

```html
<!-- Shadows -->
<div class="shadow-xs">Subtle</div>
<div class="shadow-sm">Small</div>
<div class="shadow-md">Medium</div>
<div class="shadow-lg">Large</div>

<!-- Borders -->
<div class="card-border">Card with border</div>
<div class="border-l-4 border-primary">Left accent</div>
<div class="rounded-box">DaisyUI rounded</div>
<div class="rounded-lg">Tailwind rounded</div>
<div class="rounded-3xl">Extra rounded</div>
```

---

## Animations

### Built-in

```css
/* Rotate animation */
animation: {
  rotate: 'rotate 1s linear infinite',
}

/* Transition */
.transition-all.duration-300
```

### Usage

```html
<!-- Smooth transitions -->
<div class="transition-all duration-300">Content</div>

<!-- Loading spinner -->
<span class="loading loading-spinner"></span>
```

---

## Accessibility

### Focus States

- All interactive elements have visible focus rings
- Use `focus:ring-2 focus:ring-inset focus:ring-indigo-600`

### Keyboard Navigation

- Tab through interactive elements
- Enter/Space to activate buttons
- Arrow keys in menus
- Hotkeys via `hotkeys.service.ts`

### Screen Readers

- Use semantic HTML (`<nav>`, `<main>`, `<header>`)
- Include `aria-label` on icon-only buttons
- Provide `alt` text on images

---

## Related Documentation

- [Components](./components.md) - Component architecture
- [Styling](./styling.md) - TailwindCSS conventions
- [State Management](./state-management.md) - NgRx patterns
