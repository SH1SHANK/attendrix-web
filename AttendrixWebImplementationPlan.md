# Attendance Management System - Web Client Implementation Plan

**Version:** 1.0  
**Date:** January 31, 2026  
**Objective:** Create a maintainable, modular, and performant Next.js web client

---

## Executive Summary

This plan outlines a comprehensive approach to building a web-based attendance management system that leverages existing RPC functions, maintains consistency with the Android app, and provides an optimal user experience through strategic caching, server-side rendering, and progressive enhancement.

---

## Phase 1: Foundation & Architecture Setup

### 1.1 Project Initialization

**Goal:** Establish the technical foundation

**Actions:**

- Initialize Next.js 14+ project with App Router
- Configure TypeScript with strict mode for type safety
- Set up ESLint and Prettier for code consistency
- Configure Tailwind CSS for styling (matches modern web standards)
- Establish Git workflow and branch strategy

**Deliverables:**

- Clean project structure
- Development environment configuration
- Code quality tools configured

---

### 1.2 Authentication Layer

**Goal:** Integrate Firebase Authentication seamlessly

**Actions:**

- Create Firebase project configuration and service initialization
- Implement authentication context provider for global user state management
- Build authentication middleware for protected routes
- Create session management hooks (useAuth, useUser)
- Implement sign-in, sign-up, and sign-out flows
- Add authentication persistence and token refresh logic

**Key Decisions:**

- Use React Context API for auth state (avoids prop drilling)
- Implement server-side session validation for security
- Store minimal user data client-side (only what's needed)

**Deliverables:**

- Functional authentication system
- Protected route guards
- Session persistence across page refreshes

---

### 1.3 Database Connection Layer

**Goal:** Establish type-safe Supabase integration

**Actions:**

- Configure Supabase client for browser and server environments
- Generate TypeScript types from database schema using Supabase CLI
- Create environment variable management (separate for dev/staging/prod)
- Implement connection pooling strategy
- Set up database error handling patterns

**Key Decisions:**

- Separate clients for server components vs client components
- Use Supabase's built-in connection pooling
- Implement retry logic for transient failures

**Deliverables:**

- Configured Supabase clients
- Generated TypeScript types
- Environment configuration

---

## Phase 2: Core Data Layer Implementation

### 2.1 RPC Function Wrapper Layer

**Goal:** Create type-safe, reusable RPC function wrappers

**Actions:**

- Build a centralized RPC client class that wraps all five RPC functions
- Implement consistent error handling and logging across all functions
- Add input validation and sanitization
- Create response transformation logic (database format → application format)
- Implement timeout and retry mechanisms

**Design Pattern:**

- **Singleton Pattern** for RPC client to prevent multiple instances
- **Factory Pattern** for creating configured clients with different settings
- **Adapter Pattern** to transform database responses into domain models

**Function Implementations Needed:**

1. `getCurrentOrNextClass()` - with 1-minute cache
2. `getTodaySchedule()` - with 5-minute cache
3. `getUpcomingClasses()` - with 15-minute cache
4. `getUserPastClasses()` - with filter parameter support
5. `getUserCourseAttendanceSummary()` - ground truth function
6. `markAttendance()` - write operation, no cache

**Deliverables:**

- Complete RPC client library
- Comprehensive error handling
- Input/output validation

---

### 2.2 Service Layer Development

**Goal:** Implement business logic and data orchestration

**Actions:**

- Create three service classes: AttendanceService, ClassesService, UserService
- Implement data transformation and enrichment logic
- Build composite data fetching functions (e.g., getDashboardData)
- Add calculation utilities (attendance insights, statistics)
- Implement data aggregation and grouping functions

**Service Responsibilities:**

**AttendanceService:**

- Orchestrate dashboard data fetching (parallel RPC calls)
- Mark attendance with validation
- Calculate attendance insights and trends
- Provide attendance recommendations

**ClassesService:**

- Fetch and filter past classes
- Group classes by date for UI organization
- Calculate class statistics (total, attended, missed)
- Filter missed vs attended classes

**UserService:**

- Fetch user enrollment details
- Get user profile information
- Combine Firebase Auth data with database data
- Manage user preferences

**Design Principles:**

- Single Responsibility: Each service has one clear purpose
- Dependency Injection: Services receive dependencies (e.g., RPC client)
- Pure Functions: Calculation logic has no side effects
- Composability: Services can call other services

**Deliverables:**

- Three service classes with comprehensive methods
- Business logic separated from data access
- Testable, maintainable code

---

### 2.3 Custom React Hooks

**Goal:** Provide reusable data-fetching hooks with caching

**Actions:**

- Integrate SWR (Stale-While-Revalidate) library for data fetching
- Create custom hooks for each major data requirement
- Implement optimistic updates for mutations
- Configure cache invalidation strategies
- Add loading and error states management

**Hooks to Implement:**

1. **useCurrentClass**
   - Fetches current/next class
   - 1-minute refresh interval
   - Real-time progress calculation

2. **useTodaySchedule**
   - Fetches today's classes with attendance
   - 5-minute refresh interval
   - Invalidates on attendance mark

3. **usePastClasses**
   - Fetches historical classes
   - Supports filter parameter (7d, 14d, 30d, all)
   - Supports missed-only filter
   - 5-minute deduplication

4. **useAttendanceSummary**
   - Fetches course-wise attendance
   - 15-minute refresh interval
   - Ground truth for all statistics

5. **useClassCheckIn**
   - Marks attendance
   - Optimistic updates
   - Automatic cache invalidation
   - Rollback on error

6. **useUpcomingClasses**
   - Fetches next working day classes
   - 15-minute refresh
   - Invalidates at midnight

**Cache Strategy:**

- **Time-based revalidation:** Different intervals per data type
- **On-focus revalidation:** Refresh when user returns to tab
- **Manual revalidation:** Trigger on specific actions
- **Optimistic updates:** Immediate UI feedback
- **Automatic rollback:** Revert on error

**Deliverables:**

- Six production-ready hooks
- Consistent error handling
- Optimized caching behavior

---

## Phase 3: Page Implementation

### 3.1 Dashboard Page

**Goal:** Real-time overview of current and upcoming classes

**Structure:**

- Use Server Component for initial data load (SEO, faster FCP)
- Nest Client Component for interactivity
- Implement incremental static regeneration (ISR) where applicable

**Data Flow:**

1. Server Component fetches initial data at request time
2. Pass data as props to Client Component
3. Client Component hydrates and sets up SWR polling
4. Updates stream in via 1-minute refresh

**Sections to Build:**

### User Greeting Card

- Displays greeting to User (e.g. Good Morning! Shashank)
- Displays Sub-Greeting to User (e.g. How's Your Day Going Today?)

**Current Class Card:**

- Display current class or next upcoming class
- Show progress bar for ongoing class
- Display time remaining
- Real-time updates (1-minute polling)

### Today's Schedule List

(Tab Bar Below The current Class Card Shared With Upcoming Classes Section)

- Show all classes for current day
- Attendance toggle for each class
- Visual indicators (attended = green, pending = gray, missed = red)
- Disable toggle for future classes
- Show course-level stats (classes needed/can skip)

**Attendance Summary Cards:**

- Overall attendance percentage
- Courses above/below goal
- Critical courses needing attention
- Quick insights and recommendations

### Upcoming Preview

(In a Tab Shared With Today's Classes)

- Next working day's classes
- Will Have a Horizontal Calender And Default Selcted For Netx Working Day and User Can Scroll Through All Days and Check That Day's Classes

**Interaction Flow:**

1. User views dashboard → Server renders initial state
2. Client hydrates → SWR starts polling
3. User toggles attendance → Optimistic update
4. API call succeeds → Cache invalidates → UI updates
5. API call fails → Rollback → Show error toast

**Deliverables:**

- Fully functional dashboard
- Real-time data updates
- Responsive design
- Optimistic UI updates

---

### 3.2 Classes Page

**Goal:** Historical view of all attended and missed classes

**Structure:**

- Client Component (no SEO benefit, highly interactive)
- Implement virtualization for long lists (performance)
- Use URL query parameters for filter state (shareable links)

**Sections to Build:**

**Filter Controls:**

- Tab-based filter: 7d, 14d, 30d, All (default: 7d)
- Toggle switch: Show only missed classes
- Persist filter state in URL query params

**Statistics Panel:**

- Four stat cards: Total, Attended, Missed, Attendance Rate
- Visual representation (color-coded)
- Update dynamically based on filters

**Class List:**

- Group classes by date
- Show date headers (e.g., "Today", "Yesterday", specific dates)
- Class cards with color coding:
  - Green border/background: Attended
  - Red border/background: Missed
- Display: Course name, time, venue, status
- Click to view details (future: mark late attendance)

**Interaction Flow:**

1. User selects filter → URL updates → Data refetches
2. User toggles "missed only" → Filter applied client-side
3. User scrolls → Virtualization renders visible items only
4. User clicks class → Navigate to detail modal/page

**Performance Optimizations:**

- Virtualized scrolling for 100+ classes
- Client-side filtering after initial fetch
- Memoize grouped data calculation
- Debounce filter changes

**Deliverables:**

- Filterable class history
- Performant rendering
- Color-coded visual feedback
- Shareable filter states

---

### 3.3 Profile Page

**Goal:** User information and academic overview

**Structure:**

- Server Component for initial load
- Static where possible (user data changes infrequently)
- Optional ISR with longer revalidation period

**Sections to Build:**

**Personal Information:**

- Name, email (from Firebase Auth)
- Student ID, batch, semester (from database)
- Department, program details
- Profile photo (if available)

**Academic Details:**

- Current semester
- Enrolled courses list
- Batch information
- Department affiliation

**Attendance Overview:**

- Overall attendance percentage
- Total classes vs attended
- Course-wise breakdown
- Attendance trends (optional: chart/graph)

**Actions:**

- Edit profile (future feature)
- Change password
- Logout button

**Deliverables:**

- Complete profile page
- Academic information display
- Logout functionality

### Phase 4: User Documentation

**Goal:** Help users navigate the application

**Materials to Create:**

- User guide / manual
- FAQ section
- Troubleshooting guide
- Video tutorials (optional)
- In-app help tooltips

**Deliverables:**

- User-facing documentation
- Help center (if applicable)

---

## Success Metrics

### Technical Metrics

- Page load time < 2 seconds
- API response time < 100ms (p95)
- Attendance marking success rate > 99%
- Zero critical bugs in production
- 80%+ code coverage

### User Experience Metrics

- User satisfaction score > 4.5/5
- Task completion rate > 95%
- Low error rates
- High adoption rate
- Positive feedback

### Performance Metrics

- Core Web Vitals: All "Good"
- Lighthouse score > 90
- Mobile performance score > 85
- Accessibility score > 95

---
