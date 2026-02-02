---
description: "Attendrix Web Code Rules and Best Practices"
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "web",
    "context7/*",
    "supabase/*",
    "agent",
    "todo",
  ]
---

# Attendrix Web - AI Agent Coding Rules

**Version:** 1.0  
**Project:** Attendrix - Neo-Brutalist Academic Attendance Platform  
**Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase, Firebase Auth

---

## 1. Architecture Enforcement

### File Structure Rules

| Rule                   | Enforcement                                                             | Error Message                                                               |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Route Grouping**     | All routes MUST use `(auth)` or `(app)` grouping                        | "Use route groups: `(auth)/signin/page.tsx` not `auth/signin/page.tsx`"     |
| **Private Components** | Co-located components MUST use `_components` or `_hooks` prefix         | "Private components go in `_components/`, not `components/`"                |
| **Public Components**  | Shared components go in `/components/retroui/` or `/components/shared/` | "Shared UI goes in `/components/retroui/`, page-specific in `_components/`" |
| **Hook Location**      | Feature hooks in `/hooks/`, page-specific hooks in `app/**/_hooks/`     | "Reusable hooks in `/hooks/`, page-specific in `_hooks/`"                   |
| **Service Layer**      | All Supabase RPC calls MUST go through `/lib/services/`                 | "No direct Supabase calls in components—use service layer"                  |
| **Type Safety**        | All database types MUST be imported from `/types/database.ts`           | "Use generated types, do not inline interface definitions"                  |

### Forbidden Patterns

```typescript
// ❌ NEVER: Direct Supabase in components
const { data } = await supabase.rpc('get_today_schedule')

// ✅ ALWAYS: Use service layer
const schedule = await ClassesService.getTodaySchedule(userId)

// ❌ NEVER: Inline styles or arbitrary values
<div className="mt-[13px]">

// ✅ ALWAYS: Use design tokens
<div className="mt-3"> // or custom spacing scale

// ❌ NEVER: `any` types
function processData(data: any)

// ✅ ALWAYS: Strict typing
function processData(data: ScheduleItem): ProcessedSchedule
2. Neo-Brutalist Design System Compliance
Color Palette (Mandatory)
Use ONLY these CSS variables:
css
Copy
:root {
  --color-bg: #F5F5F0;        /* Off-white paper */
  --color-text: #1A1A1A;      /* Near-black ink */
  --color-accent: #FF6B6B;    /* Coral red - Critical/Active */
  --color-safe: #51CF66;      /* Vibrant green - Safe >80% */
  --color-warning: #FFD93D;   /* Bold yellow - Warning 65-80% */
  --color-border: #1A1A1A;    /* Black borders */
  --color-muted: #6B7280;     /* Gray for disabled states */
}
Enforcement: Any hardcoded hex values in components will be flagged.
Typography Rules
Table
Copy
Element	Font	Weight	Transform	Size
H1/Hero	Space Grotesk	700 (Bold)	UPPERCASE	text-4xl md:text-6xl
H2/Section	Space Grotesk	700	UPPERCASE	text-2xl md:text-3xl
H3/Card Title	Space Grotesk	600	UPPERCASE	text-lg md:text-xl
Body	Space Grotesk	400	Normal	text-base
Labels	Space Grotesk	500	UPPERCASE	text-xs tracking-wide
Forbidden Fonts: Inter, Roboto, Arial, system-ui (unless for code blocks)
Component Styling Rules
TypeScript
Copy
// ❌ NEVER: Subtle shadows, rounded corners, gradients
<div className="shadow-md rounded-lg bg-gradient-to-r">

// ✅ ALWAYS: Hard shadows, sharp corners, flat colors
<div className="shadow-[4px_4px_0px_0px_#000] border-2 border-[#1A1A1A] bg-[#F5F5F0]">

// ❌ NEVER: Default border-radius
<div className="rounded-md">

// ✅ ALWAYS: Sharp or intentional brutalist radius
<div className="rounded-none"> // or specific px values like rounded-sm (2px)

// ❌ NEVER: border-1 or subtle borders
<div className="border border-gray-200">

// ✅ ALWAYS: Thick, black borders
<div className="border-2 border-[#1A1A1A]">
Animation Guidelines
Use Framer Motion with these presets:
TypeScript
Copy
// Entrance animation
const entrance = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

// Press/Tap animation
const press = {
  scale: 0.98,
  x: 2,
  y: 2,
  transition: { duration: 0.1 }
}

// Stagger children
const stagger = {
  visible: { transition: { staggerChildren: 0.05 } }
}
Forbidden: Generic fade-ins, slow transitions (>300ms), excessive bounce
3. Data Fetching & State Management
SWR Configuration Standards
TypeScript
Copy
// hooks/useDashboardData.ts
export const SWR_CONFIG = {
  currentClass: {
    refreshInterval: 60000,      // 1 minute
    dedupingInterval: 60000,
    revalidateOnFocus: true
  },
  todaySchedule: {
    refreshInterval: 300000,     // 5 minutes
    dedupingInterval: 60000
  },
  attendanceSummary: {
    refreshInterval: 900000,     // 15 minutes
    dedupingInterval: 300000
  }
}
RPC Function Mapping
Table
Copy
Feature	RPC Function	Cache	Service Method
Current/Next Class	get_current_or_next_class	1 min	ClassesService.getCurrentOrNext()
Today's Schedule	get_today_schedule	5 min	ClassesService.getTodaySchedule()
Past Classes	get_user_past_classes	5 min	ClassesService.getPastClasses()
Attendance Summary	get_user_course_attendance_summary	15 min	AttendanceService.getSummary()
Mark Attendance	mark_attendance	No cache	AttendanceService.markAttendance()
Optimistic Update Pattern
TypeScript
Copy
// REQUIRED pattern for mutations
const markAttendance = async (scheduleId: string, status: boolean) => {
  // 1. Cache current state
  const previousData = mutate(key, data, false)

  // 2. Optimistic update
  mutate(key, optimisticData, false)

  try {
    // 3. API call
    await AttendanceService.markAttendance(scheduleId, status)
    // 4. Revalidate
    mutate(key)
  } catch (error) {
    // 5. Rollback
    mutate(key, previousData, false)
    throw error
  }
}
4. Code Quality Rules
TypeScript Strictness
yaml
Copy
compilerOptions:
  strict: true
  noImplicitAny: true
  strictNullChecks: true
  noUncheckedIndexedAccess: true
  exactOptionalPropertyTypes: true
Required: All functions must have explicit return types. All props must be typed via interfaces.
Naming Conventions
Table
Copy
Category	Pattern	Example
Components	PascalCase	HeroClassCard.tsx
Hooks	camelCase, use prefix	useDashboardData.ts
Services	PascalCase, Service suffix	AttendanceService.ts
Types	PascalCase, descriptive	ScheduleItem, AttendanceStatus
RPC Responses	PascalCase, *Response	TodayScheduleResponse
Constants	UPPER_SNAKE_CASE	REFRESH_INTERVALS
Import Order (Enforced)
TypeScript
Copy
// 1. React/Next.js
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

// 2. External libraries
import { motion } from 'framer-motion'
import useSWR from 'swr'

// 3. Internal absolute imports
import { cn } from '@/lib/utils'
import { ClassesService } from '@/lib/services/classes-service'
import { useAuth } from '@/hooks/useAuth'

// 4. Internal relative imports (only in same feature)
import { ClassCard } from './_components/ClassCard'
Error Handling Standards
TypeScript
Copy
// ❌ NEVER: Silent failures
try {
  await fetchData()
} catch (e) {
  console.log(e)
}

// ✅ ALWAYS: User-facing errors with recovery
try {
  await fetchData()
} catch (error) {
  if (error instanceof AuthError) {
    redirect('/signin')
  }
  toast.error('Failed to load schedule', {
    action: { label: 'Retry', onClick: () => refetch() }
  })
  console.error('[Dashboard] fetchData failed:', error)
}
5. Accessibility (WCAG 2.1 AA)
Required Attributes
Table
Copy
Element	Requirement
Interactive	aria-label or visible text
Toggle buttons	aria-pressed
Live regions	aria-live="polite" for status updates
Modals	aria-modal="true", focus trap, escape to close
Navigation	aria-current="page" for active route
Progress	role="progressbar", aria-valuenow
Keyboard Navigation
All interactive elements must be focusable
Visible focus rings: focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:ring-offset-2
Escape key must close modals/dropdowns
Arrow keys for date strip navigation
6. Performance Budgets
Table
Copy
Metric	Target	Max
FCP (First Contentful Paint)	< 1.0s	1.5s
TTI (Time to Interactive)	< 2.5s	3.0s
LCP (Largest Contentful Paint)	< 1.5s	2.5s
Bundle Size (page)	< 150KB	200KB
Image Size	< 100KB each	Use WebP
RPC Response	< 100ms	300ms
Optimization Rules
TypeScript
Copy
// ✅ USE: Dynamic imports for heavy components
const AttendanceCalculator = dynamic(
  () => import('./_components/AttendanceCalculator'),
  { loading: () => <CalculatorSkeleton /> }
)

// ✅ USE: React.memo for list items
export const ClassCard = React.memo(function ClassCard({ item }) {
  // Component
})

// ✅ USE: Virtualization for lists > 20 items
import { Virtuoso } from 'react-virtuoso'

// ❌ AVOID: Large inline objects in render
// ❌ AVOID: Inline function definitions in JSX props
```
