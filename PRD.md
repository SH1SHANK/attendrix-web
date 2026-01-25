# Part 1: Product Requirements Document (PRD)

Project: Attendrix Web App Interface (Phase 1: UI Implementation) Version: 1.3.2 (Web Client) Design System: RetroUI (Neo-Brutalist, High Contrast) Core Navigation: Bottom Dock (4-Tab System)

This document focuses on building the functional "App Dashboard" that students would see after logging in, using the requested Bottom Dock navigation and RetroUI aesthetic

## 1. App Shell & Navigation

Requirement: A persistent, mobile-first "App Shell" with a bottom navigation dock.

Visual Style:

Fixed at viewport bottom.

Thick top border (2px Black).

Background: #FDFBF7 (Cream).

Active State: Icon fills with Primary Color (#FF6B6B) + Hard Shadow offset.

Dock Items:

Dashboard (Home Icon): The marking interface.

Ledger (Book/Ledger Icon): Subject-wise analysis.

Calendar (Calendar Icon): History and temporal view.

Profile (User/Mage Icon): Gamification and Settings.

### Page 1: Main Dashboard (The Command Center)

Goal: Quickest possible check-in latency.

Header:

Greeting: "Afternoon, [Name]" (Mock using Firebase schema).

Gamification: Small "Mage Rank" pill (e.g., "Lvl 4").

Hero Component: "Next Up"

Logic: Identify the current time and find the next timetableRecord based on the Institute Slot system.

UI: Large card showing "Time Remaining," "Course Name," and "Venue."

Timeline (The Marking Interface):

Vertical list of today's classes sorted by time.

Interaction:

Toggle Button: A customized Retro switch.

State Logic: Present (Green), Absent (Red), Pending (Grey).

Note: Uses existing attendanceRecords logic (Presence/Absence is an event row in DB).

### Page 2: The Subject Ledger (Academic Health)

Goal: Subject-wise eligibility visualization (No Overall %).

Data Logic: Aggregation of totalClasses vs attendedClasses per courseID.

Component: Subject Card

Metric: "Safe Cuts Left" (Calculated: How many absences until <75%).

Visual Indicator: Traffic light system.

Green (>80%)

Yellow (65-80% - Medical Zone)

Red (<65% - Critical)

Grid Layout: Responsive Masonry grid.

### Page 3: Calendar & History (Temporal View)

Goal: Retrospective analysis and pattern spotting.

Sub-Navigation: Segmented Control (Toggle: Calendar | List).

Calendar View:

Month view.

Dots: Green dot (All classes attended), Red dot (Any class missed).

Logic: Queries timetableRecords joined with attendanceRecords.

List View (History):

Reverse chronological list of past classes.

Editability: Allow status toggle only for "Today" (Anti-cheat constraint).

### Page 4: Profile (Management)

Goal: Gamification display and App Configuration.

Mage Identity:

Large Avatar.

XP Bar: Progress to next Mage Level (e.g., 1880/2000 XP).

Streak: "Current Streak" (Days active).

Settings Group:

Sync: Google Calendar Toggle (Mock UI for now).

Data: "Reset Account" (Danger Button).
