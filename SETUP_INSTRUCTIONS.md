# Project Setup Instructions

This codebase has been updated to support **shadcn**, **Tailwind CSS**, and **TypeScript**. 

## Current Configuration
- **Components Path**: `src/components/ui`
- **Styles Path**: `src/index.css`
- **TypeScript**: Enabled (Vite)

## Why `/components/ui`?
In a shadcn project, it is critical to keep re-usable UI primitives (atomic components like Buttons, Inputs, Cards) in the `/components/ui` folder. This is the default path used by the shadcn CLI (`npx shadcn-ui@latest add <component>`). Keeping them separate from your page-specific components ensures:
1. **Consistency**: All base UI elements follow the same design system.
2. **Scalability**: You can easily pull in new updates or components from the shadcn registry.
3. **Clarity**: Developers know exactly where to find the building blocks of the UI.

---

## How to Set Up from Scratch (If needed)

### 1. Initialize TypeScript (Vite)
If you are starting a new project:
```bash
npm create vite@latest my-app -- --template react-ts
```

### 2. Install Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Configure `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... add other shadcn colors
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. Initialize shadcn CLI
```bash
npx shadcn-ui@latest init
```
During initialization, choose the following:
- **Style**: Default
- **Base Color**: Zinc / slate
- **CSS Variables**: Yes
- **Alias for components**: `@/components`
- **Alias for utils**: `@/lib/utils`

### 4. Install Dependencies
```bash
npm install lucide-react clsx tailwind-merge @radix-ui/react-icons class-variance-authority
```

---

## Maintenance
To add new shadcn components in the future:
```bash
npx shadcn-ui@latest add <component-name>
```
Example:
```bash
npx shadcn-ui@latest add dialog
```
