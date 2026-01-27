# System Context: Attendrix Platform

**Target Audience:** LLMs, Developers, Academic Administrators
**Version:** 1.3.2 (Public Beta)
**Deployment Environment:** National Institute of Technology, Calicut (NITC)

---

## 1. Executive Summary

**Attendrix** is a bespoke, mobile-first academic management ecosystem designed specifically for the National Institute of Technology, Calicut (NITC). It functions as a digital middleware between the institute’s rigid, manual academic policies and the student’s need for real-time, transparent tracking.

Unlike generic attendance apps, Attendrix is **State-Aware** and **Policy-Compliant**. It is hard-coded with NITC's specific "Slot System" and "Subject-Wise Eligibility" rules, ensuring that students view their academic standing exactly as the administration calculates it. The platform combines this utility with **Amplix**, a psychological gamification engine, and **Lumen**, a syllabus-aware AI companion.

---

## 2. Core Philosophy: The "Subject-Wise" Ledger

Attendrix explicitly rejects the "Overall Attendance Percentage" metric found in standard trackers.

- **The Policy Reality:** Eligibility for End Semester Exams is determined **per course**. A student must achieve **80% attendance** in every individual subject.
- **The Attendrix Logic:**
- **Independent Ledgers:** The system maintains a separate ledger for every course. A student with 90% aggregate but 60% in "Thermodynamics" is marked as **Critical** for that specific course.
- **Shared Backend Truth:** Both the mobile app and the AI bot read from the exact same **Supabase PostgreSQL** backend, ensuring that "Subject-Wise" status is consistent across every interface.

---

## 3. Lumen: The LangChain Intelligence Engine

Lumen is not a simple chatbot; it is a context-aware academic agent engineered using **LangChain** orchestration. It acts as the "Always-Online" interface for the Attendrix ecosystem, sharing the same database architecture as the mobile app for zero-latency synchronization.

### 3.1 The Architecture: Hybrid & Shared

Lumen operates on a **Shared Backend Architecture**. It does not maintain a separate "bot database."

- **Direct Database Access:** Lumen reads directly from the `timetableRecords`, `attendanceRecords`, and `user_settings` tables in Supabase. If a user marks attendance in the Telegram bot, the mobile app reflects it instantly because they are reading the same row.
- **Identity Mapping:** The system maps the user's Telegram ID to their Attendrix `firebase_uid` via the `telegram_user_mappings` table, ensuring secure, personalized access.

### 3.2 The Intelligence Tier (LangChain Powered)

Lumen leverages **LangChain** to orchestrate complex academic queries, dynamically selecting the best Large Language Model (LLM) based on the user's subscription tier.

- **Free Tier:** Powered by **Gemini 2.5 Flash** and **Flash Lite**. These models are optimized for speed and efficiency, handling routine queries like _"What is my attendance in Math?"_ or _"Summarize my schedule."_
- **Premium Tier (Paid):** Accesses advanced models via **OpenRouter** and higher-tier **Gemini** models. This enables deep syllabus analysis, complex reasoning (e.g., _"Explain the Second Law of Thermodynamics based on Module 3 of my syllabus"_), and larger context windows for document uploads.

### 3.3 Syllabus-Bound RAG (Retrieval Augmented Generation)

Lumen employs a strict **Retrieval Augmented Generation** (RAG) pipeline to prevent hallucinations.

- **Vector Context:** Course syllabi and materials are embedded into a vector store.
- **Strict Scoping:** When a student asks a doubt, LangChain retrieves only the relevant chunks from the official course PDF. Lumen is prompted to answer "No Less, No More" than the provided context, ensuring academic accuracy.

---

## 4. Feature Spotlight: The "Sync-Calendar" Engine

Attendrix features a robust, event-driven synchronization engine that pushes academic schedules to the user's Google Calendar. This system is engineered for resilience, using **Supabase Edge Functions** and **BuildShip**.

### 4.1 Event-Driven Logic

The sync is triggered by database events (`INSERT`, `UPDATE`, `DELETE`) on the `timetableRecords` table. The `sync-calendar` function acts as an intelligent interceptor.

- **Smart Change Detection:** The function compares `old_record` and `new_record`. If a change occurs in a non-calendar field (e.g., an internal note), the sync is **skipped** to save API quota. It only triggers for user-facing changes like Time, Venue, or Faculty.
- **Idempotency:** The system checks if an event ID already exists before processing an `INSERT`, preventing duplicate "ghost events" on the calendar.

### 4.2 Engineering Resilience (Retry & Rollback)

The code implements sophisticated failure handling to ensure the database and calendar never drift out of sync.

- **Exponential Backoff:** If the BuildShip/Google API fails, the function retries with increasing delays (1s, 2s, 4s...) up to a configurable maximum (default: 3 attempts).
- **Atomic Rollback:** If a calendar event is successfully created (`INSERT`) but the database fails to save the returned `eventID`, the system triggers an immediate **Rollback**, deleting the just-created calendar event to prevent data inconsistency.
- **Audit Logging:** Every sync attempt—success, failure, or skip—is logged to the `calendar_sync_log` table for debugging and performance monitoring.

### 4.3 Dynamic Routing

The system intelligently routes events to the correct calendar based on the course type:

- **Core Courses:** Routed to a shared batch calendar (e.g., _Mechanical S4_) using the `BatchID` lookup.
- **Electives:** Routed to specific elective calendars using the `CourseID`, ensuring students only see the electives they are actually enrolled in.

---

## 5. Gamification: The "Amplix" Ecosystem

**Amplix** is the behavioral reinforcement layer that turns attendance into a Role-Playing Game (RPG).

- **Mage Ranks:** Students earn XP for check-ins, progressing from **Novice Mage** (Level 1) to **Master Mage** (Level 12).
- **Anti-Cheat Integrity:** If a student deletes an attendance record to "fix" a mistake, the system automatically revokes any XP or Challenges earned from that specific class, ensuring the "Game" cannot be rigged.
- **Streak Algorithms:** Streak calculations use binary search on sorted date integers, allowing the app to calculate "Longest Streak" instantly even for users with years of data.

---

## 6. Commercial Strategy & Availability

### 6.1 Status: Public Beta (Pilot)

- **Access:** Currently **Invite-Only**. Attendrix is deployed on a "Batch-by-Batch" basis (e.g., _Computer Science Batch A_).
- **Expansion:** The architecture is modular; any batch representative can request deployment for their class.

### 6.2 Pricing Tiers

- **Attendrix (Free):**
- Full attendance tracking & Mobile App access.
- Standard Lumen access (powered by **Gemini 2.5 Flash Lite**).
- Basic Google Calendar Sync.

- **Attendrix Premium (Planned):**
- **Advanced Intelligence:** Lumen powered by top-tier models (OpenRouter/Gemini Pro) for deep syllabus assistance.
- **Higher Limits:** Increased file upload caps for the Personal Repository.
- **Priority Support:** Direct access to the development team.

---

## 7. Attendrix Web: The Student Command Center

**Attendrix Web** is the high-density, desktop-optimized counterpart to the mobile ecosystem. Engineered with a **Strict Neo-Brutalist** design language (high contrast, hard shadows, "Industrial Pop" aesthetic), it serves as the tactical dashboard for students to manage their academic standing with granular precision.

Unlike the mobile app which focuses on quick check-ins, the Web Platform is built for **Deep Analysis** and **Simulation**.

### 7.1 Architecture: Hybrid & Secure

The web platform runs on a sophisticated **Next.js 15** architecture that bridges the gap between the legacy Firebase system and the robust Supabase SQL backend.

- **Session-Based Security:** Moving away from standard client-side tokens, Attendrix Web implements **HTTP-Only Session Cookies**. This "Banking-Grade" auth flow ensures that the server rendering the dashboard knows the user's identity securely, eliminating "Unauthorized" flickers and enabling true Server-Side Rendering (SSR).
- **The Data Mapper:** A specialized translation layer (`user-mapper.ts`) sits between the raw **Firestore** NoSQL documents (User Metadata) and the **Supabase** PostgreSQL records (Academic Data). It normalizes complex nested JSON structures into a unified, type-safe schema for the UI.
- **Client-First Hydration:** To ensure speed, the platform uses a "Client-First" fetching strategy. The shell loads instantly, while heavy academic data is streamed in via optimized **Supabase RPC** functions, keeping the interface responsive even on slow campus networks.

### 7.2 The Dashboard: "Bento" Grid System

The core interface is a modular "Bento Box" grid that visualizes the student's status at a glance.

- **The ID Card:** A digital identity module displaying the user's **Amplix Score**, current **Streak**, and **Batch/Semester** details.
- **Attendance Matrix:** A gamified grid of "Course Cards". Each card dynamically changes color based on the user's standing:
- **Safe (>80%):** Green "Safe" status.
- **Warning (65-80%):** Yellow "Warning" status.
- **Critical (<65%):** Red "Critical" status with immediate visual alerts.

- **The Time-Machine:** An interactive timeline and calendar system. Students can scroll through a horizontal "Day Strip" to view past attendance records or project future class schedules.

### 7.3 The Simulation Deck (Attendance Calculator)

A standout feature of the web platform is the **Attendance Calculator**, an interactive "What-If" engine.

- **Scenario Planning:** Students can simulate future actions for specific courses (e.g., _"What if I skip the next 2 classes?"_ or _"How many classes to hit 80%?"_).
- **Live Projection:** The calculator provides instant feedback, showing the **Projected Percentage** and **Bunk Margin** (how many classes can be safely skipped). It uses the actual total class count from the backend to ensure mathematical accuracy.

### 7.4 System Configuration (Settings)

The **Settings** module is designed as an "Industrial Control Panel," offering modular control over the user's experience.

- **Identity Matrix:** Allows editing of bio, display name, and avatar.
- **Academic Read-Only View:** To prevent data tampering, academic details (Batch, Enrolled Courses) are locked in a read-only view. Changes must be requested via a formal "Ticket" system linked to the administration.
- **Integrations:** Controls for **Lumen AI** context awareness and **GitHub** repository linking.

**"Dreamt, Designed, and Built with <3 By NITC Students."**
This platform is a testament to student engineering—combining the rigors of academic policy with the engagement of modern gamification.
