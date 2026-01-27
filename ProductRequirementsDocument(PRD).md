# Product Requirements Document (PRD)

## Attendrix Showcase Website v1.3.2

---

## Document Metadata

| Field             | Value                                     |
| ----------------- | ----------------------------------------- |
| **Product**       | Attendrix Showcase Website                |
| **Version**       | 1.3.2 (Public Beta)                       |
| **Owner**         | Product Team, Attendrix                   |
| **Target Launch** | Q1 2026                                   |
| **Design System** | RetroUI (Neo-Brutalist)                   |
| **Tech Stack**    | Next.js 14+, React 18+, Tailwind CSS 3.4+ |

---

## 1. Product Vision & Goals

### 1.1 Vision Statement

Create a high-conversion, aesthetically distinctive landing page that positions Attendrix not as "just another attendance app," but as a **precision academic instrument** built by students, for students—celebrating both the technical rigor and the human-centered design philosophy behind the platform.

### 1.2 Success Metrics

| Metric                  | Target            | Measurement              |
| ----------------------- | ----------------- | ------------------------ |
| APK Download Conversion | 15%+ of visitors  | Analytics Event Tracking |
| Telegram Bot Engagement | 8%+ click-through | UTM Parameters           |
| Avg. Time on Page       | 2min 30sec+       | Google Analytics         |
| Mobile Traffic          | 70%+ of total     | Device Segmentation      |
| Bounce Rate             | <40%              | Page Analytics           |

### 1.3 Core Objectives

1. **Educate** prospective users on why "Subject-Wise" tracking is fundamentally different from generic attendance apps
2. **Build Trust** through transparency about architecture (offline-first, policy-compliant, anti-cheat)
3. **Drive Action** via dual CTAs (Download APK for power users, Telegram for low-commitment exploration)
4. **Establish Brand** using RetroUI aesthetics to stand out in a sea of Material Design clones

---

## 2. Design System Specifications

### 2.1 Visual Language: RetroUI Neo-Brutalism

#### Color Palette

```
Primary Palette:
- Background: #FDFBF7 (Cream/Off-White)
- Surface: #FFFFFF (Pure White for cards)
- Border: #000000 (Solid Black)
- Text Primary: #2D2D2D (Near-Black)

Accent Palette:
- Retro Red: #FF6B6B (Primary CTA, Critical Status)
- Teal: #4ECDC4 (Success States, Secondary Actions)
- Amber: #FFD93D (Warning States, XP/Gamification)
- Mint: #6BCF7F (Safe Status Indicators)
- Pixel Purple: #A78BFA (Premium Tier)

Semantic Colors:
- Critical: #FF6B6B
- Warning: #FFD93D
- Safe: #6BCF7F
- Neutral: #94A3B8
```

#### Typography System

```
Headings:
- H1: VT323 or Space Mono, 56-72px, Bold, Letter-spacing: -1px
- H2: VT323, 40-48px, Bold
- H3: Space Mono, 28-32px, Medium

Body:
- Primary: Inter or DM Sans, 16-18px, Regular (400)
- Secondary: 14-16px, Regular
- Caption: 12-14px, Medium

Monospace (Code/Terminal):
- JetBrains Mono or Fira Code, 14px
```

#### Component Patterns

**Buttons (RetroUI Standard)**

```
Default State:
- Border: 3px solid #000000
- Shadow: 5px 5px 0px #000000
- Padding: 12px 32px
- Font: Space Mono, 16px, Bold
- Transition: transform 0.1s ease

Hover State:
- Transform: translate(3px, 3px)
- Shadow: 2px 2px 0px #000000

Active State:
- Transform: translate(5px, 5px)
- Shadow: 0px 0px 0px #000000
```

**Cards (Feature Containers)**

```
- Border: 3px solid #000000
- Shadow: 6px 6px 0px #000000
- Border-radius: 0px (hard corners)
- Background: #FFFFFF
- Padding: 24px
```

**Dividers**

```
- Border: 2px dashed #000000
- Margin: 48px 0px
```

### 2.2 Iconography

- **Style**: Pixelated/8-bit when possible (use libraries like Pixel Icons or custom SVGs)
- **Fallback**: Lucide React icons with increased stroke-width (2.5px) for brutalist feel
- **Size Scale**: 24px (inline), 32px (feature headers), 48px (section heroes)

### 2.3 Responsive Breakpoints

```
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px - 1439px
Wide: 1440px+
```

---

## 3. Section-by-Section Specifications

### Section 1: Hero Section (Above the Fold)

#### 3.1.1 Layout Structure

**Desktop (1024px+)**

- Grid: 60% (Left - Typography) | 40% (Right - Visual)
- Height: 100vh (full viewport)
- Vertical Alignment: Center

**Mobile (<768px)**

- Stack: Typography → Visual
- Height: Auto (minimum 85vh)

#### 3.1.2 Content Specifications

**Headline**

```
Copy: "Attendance, Reimagined."
Typography: VT323, 72px (Desktop) / 48px (Mobile)
Color: #2D2D2D
Treatment: Slight glitch effect on load (CSS animation: 0.5s flicker)
```

**Subheadline**

```
Copy: "The only academic tracker built for NIT Calicut's Slot System.
       Subject-Wise precision. Gamified engagement. Zero guesswork."
Typography: DM Sans, 20px, Regular
Color: #64748B
Max-Width: 520px
Line-Height: 1.6
```

**Primary CTA**

```
Label: "Download APK ↓"
Style: RetroUI Button (Red Accent)
- Background: #FF6B6B
- Text: #FFFFFF
- Border: 3px solid #000000
- Shadow: 5px 5px 0px #000000
Action: Direct download link to latest .apk (tracked event: "apk_download_hero")
```

**Secondary CTA**

```
Label: "Chat with Lumen AI →"
Style: RetroUI Button (Teal Accent)
- Background: #4ECDC4
- Text: #2D2D2D
- Border: 3px solid #000000
Action: Opens Telegram bot (tracked event: "telegram_open_hero")
```

#### 3.1.3 Visual Specification (Right Panel)

**Container Design**

```
Visual Metaphor: "Retro Computer Monitor"
- Outer Frame: 4px solid black border
- Monitor "Stand": CSS-drawn trapezoid at bottom
- Screen Border: 8px inset #2D2D2D (bezel effect)
- Shadow: 8px 8px 0px #000000
```

**Content Within Monitor**

- Screenshot: Attendrix Dashboard (Subject-Wise view showing multiple courses)
- Treatment: Slight scanline overlay (CSS: repeating-linear-gradient for CRT effect)
- Animation: Gentle "power-on" fade (1.2s delay after page load)

#### 3.1.4 Background Treatment

- Base: #FDFBF7
- Accent: Subtle dot-grid pattern (1px dots, 32px spacing, #E5E7EB opacity 40%)
- Alternative: Pixel-art style geometric shapes in corners (low opacity)

---

### Section 2: The "Problem vs. Solution" Marquee

#### 3.2.1 Layout Structure

**Desktop**: Horizontal split (50/50) with vertical divider
**Mobile**: Stacked cards with clear separation

#### 3.2.2 Problem Card (Left)

**Visual Design**

```
Container Style: "Windows 95 Error Alert" Pastiche
- Border: 3px solid #000000
- Title Bar: Red background (#FF6B6B) with white text
- Icon: Pixelated "Warning" icon (⚠️ style)
- Shadow: 6px 6px 0px rgba(0,0,0,0.3)
```

**Content**

```
Title: "THE PROBLEM"
Typography: VT323, 24px, #FFFFFF (on red title bar)

Headline: "The 'Overall Percentage' Myth"
Typography: Space Mono, 28px, Bold

Body Copy:
"Traditional attendance trackers show you a single number: 78%, 82%, 85%.
But Our College doesn't care about your average. You need Above 80% in EVERY subject
to sit for End Semester Exams. Miss this in just one course? You're ineligible—even
if your 'overall' looks perfect.

Manual spreadsheets can't track:
• The exact Slot System (A1, B2, C1...)
• Which classes you can afford to miss
• Subject-specific safe cuts"

Typography: DM Sans, 16px, Line-height: 1.7
Icon Bullets: Red X marks (✗)
```

#### 3.2.3 Solution Card (Right)

**Visual Design**

```
Container Style: Clean RetroUI Success Card
- Border: 3px solid #4ECDC4
- Background: #FFFFFF
- Title Bar: Teal gradient
- Icon: Pixelated checkmark or shield
- Shadow: 6px 6px 0px #4ECDC4
```

**Content**

```
Title: "THE ATTENDRIX WAY"
Typography: VT323, 24px, #FFFFFF (on teal bar)

Headline: "Subject-Wise Ledgers"
Typography: Space Mono, 28px, Bold

Body Copy:
"Attendrix maintains an independent ledger for every course. Just like
the Academic Section calculates it.

Each subject shows:
• Real-time attendance percentage
• Medical leaves (auto-adjusted)
• 'Safe Cut' calculator (how many more you can miss)
• Critical status alerts (sub-80% warning)

Your dashboard shows 8 subjects? You see 8 precise percentages.
No averaging. No guessing. Policy-compliant truth."

Typography: DM Sans, 16px
Icon Bullets: Teal checkmarks (✓)
```

#### 3.2.4 Optional Enhancement: Scrolling Ticker

If horizontal space allows, add a slow-scrolling text ticker between cards:

```
Text: "82% overall ≠ Safe • Subject-Wise is the only way • Built for NITC's reality"
Style: Monospace, 14px, repeating marquee
```

---

### Section 3: Feature Grid - The Ecosystem

#### 3.3.1 Layout Architecture

**Pattern**: Bento Grid (Asymmetric Masonry)

- Desktop: 3-column grid with varying card heights
- Tablet: 2-column adaptive
- Mobile: Single column stack

**Grid Specification**

```css
Desktop Grid Template:
Row 1: [Large Feature] [2 Small Features stacked]
Row 2: [2 Medium Features] [Large Feature]
Row 3: [3 Equal Medium Features]

Gap: 24px between cards
```

#### 3.3.2 Feature Card Anatomy (Standard)

```
Structure:
┌─────────────────────┐
│ Icon (48px)         │
│ Title (H3)          │
│ Description (Body)  │
│ [Optional: Metric]  │
└─────────────────────┘

Border: 3px solid #000000
Padding: 32px
Shadow: 6px 6px 0px #000000
Background: #FFFFFF
```

#### 3.3.3 Feature 1: Intelligent Scheduling (Large Card)

**Icon**: Calendar with gear/cog overlay (pixel style)
**Title**: "Intelligent Scheduling"
**Accent Color**: #4ECDC4 (border highlight on hover)

**Body Copy**:

```
"Forget manual timetable entry. Attendrix auto-maps your courses to
NITC's Institute Slot System (A1, B1, C1, D1, TA1, TAA1...).

Core courses sync to your batch calendar. Electives route to specific
groups. When the Institute changes a slot? Your calendar updates
automatically via Edge Functions.

No duplicate entries. No missed classes."
```

**Metric Callout** (Optional visual stat):

```
"12,000+ classes synced across batches"
Typography: Space Mono, 24px, Bold
Color: #4ECDC4
```

**Hover State**: Card lifts with shadow reduction (transform + shadow transition)

---

#### 3.3.4 Feature 2: Amplix Gamification (Large Card)

**Icon**: Pixelated wizard hat or star burst
**Title**: "Amplix: The Attendance RPG"
**Accent Color**: #A78BFA (purple - gaming theme)

**Body Copy**:

```
"Every check-in earns XP. Climb from Novice Mage to Master Mage across
12 ranks. Complete Daily Challenges. Build streaks.

But here's the catch: The game can't be rigged. Delete an attendance
record to 'fix' your percentage? Amplix auto-revokes any XP or streak
earned from that class.

Your rank reflects genuine discipline, not database manipulation."
```

**Visual Enhancement**: Small embedded "Rank Badge" mockup showing Mage tiers

```
[Novice] → [Apprentice] → [Adept] → [Master]
Visual: Pixel-art progression icons
```

**Stat Callout**:

```
"Longest streak recorded: 47 days"
Typography: Space Mono, 20px
Color: #FFD93D (amber for achievement)
```

---

#### 3.3.5 Feature 3: Temporal Bridge (Medium Card)

**Icon**: Sync arrows or bridge icon
**Title**: "Real-Time Calendar Sync"
**Accent Color**: #6BCF7F (green - sync success)

**Body Copy**:

```
"Your Attendrix schedule lives in Google Calendar. Instantly.

Powered by Supabase Edge Functions with exponential backoff retry logic.
If an API fails, the system automatically rolls back to prevent 'ghost
events.'

Change a class time? Calendar updates in <2 seconds. Across all devices."
```

**Technical Note** (Optional for tech-savvy audience):

```
"Event-driven architecture • Idempotent operations • Audit logged"
Typography: JetBrains Mono, 12px, color: #64748B
```

---

#### 3.3.8 Feature 6: Safe Cut Calculator (Small Card)

**Icon**: Calculator or shield
**Title**: "Safe Cut Predictor"

**Copy**:

```
"How many more classes can I skip and still hit 80%?

Attendrix does the math:
((Current% × Classes) - (0.80 × Remaining)) / 0.20

You see: 'Safe to miss: 3 more classes'—updated live."
```

---

### Section 4: Lumen AI Spotlight

#### 3.4.1 Layout Structure

**Desktop**: 40% (Visual) | 60% (Content)
**Mobile**: Visual → Content (stacked)
**Height**: Auto (minimum 600px)

#### 3.4.2 Visual Element: Terminal Window Mockup

**Design Specification**

```
Container: Retro Terminal aesthetic
- Title Bar: Dark gray (#2D2D2D) with "LUMEN v1.3.2" text
- Close/Minimize Buttons: Pixel-art styled (non-functional, decorative)
- Body: Dark terminal background (#1E1E1E)
- Text: Monospace (JetBrains Mono), #00FF00 (green terminal text)
- Cursor: Blinking underscore animation
- Border: 4px solid #000000
- Shadow: 8px 8px 0px #000000
```

**Terminal Content** (Mock Conversation):

```
> user: explain the second law of thermodynamics from my syllabus

> lumen: Retrieving context from ME201_Thermodynamics_Module3.pdf...

Based on your course material (Section 3.2):

The Second Law states that entropy of an isolated system always
increases. Your syllabus defines it through two statements:

Kelvin-Planck: No heat engine can convert 100% heat to work in a
cyclic process.

Clausius: Heat cannot spontaneously flow from cold to hot body.

Your upcoming quiz (Week 8) will focus on Carnot efficiency
calculations from this module.

[Context: Page 47-52, uploaded 12 Jan 2026]
```

**Animation**: Text "types out" on scroll-into-view (typewriter effect, 30ms per char)

#### 3.4.3 Content Panel (Right)

**Eyebrow Text**

```
Copy: "POWERED BY LANGCHAIN"
Typography: Space Mono, 12px, Uppercase, #A78BFA
```

**Headline**

```
Copy: "Syllabus-Bound Intelligence"
Typography: VT323, 48px
Color: #2D2D2D
```

**Body Copy**

```
"Lumen isn't ChatGPT with a college theme. It's a precision academic
instrument.

How it works:
1. You upload your course syllabus (PDF/DOCX)
2. LangChain embeds it into a vector database
3. When you ask a doubt, Lumen retrieves ONLY the relevant chunks
4. The AI is prompted: 'Answer from the syllabus. No less, no more.'

This is RAG (Retrieval Augmented Generation). No hallucinations.
No generic internet answers. Just your course content, explained clearly.

Free tier: Powered by Gemini 2.5 Flash Lite
Premium: Advanced models via OpenRouter for deeper reasoning"
```

**Key Differentiators (Bullet List)**

```
✓ Syllabus-scoped responses (no web hallucinations)
✓ Dual-tier intelligence (Flash Lite → Gemini Pro)
✓ Same database as mobile app (instant sync)
✓ Telegram-native (low friction access)
```

**CTA**

```
Label: "Try Lumen Now →"
Style: RetroUI Button (Purple accent for AI theme)
Background: #A78BFA
Action: Opens Telegram bot with pre-filled message: "/start"
```

---

### Section 5: Roadmap & Pricing

#### 3.5.1 Layout Structure

**Desktop**: Side-by-side comparison cards (50/50 split)
**Mobile**: Stacked cards

#### 3.5.2 Section Header

```
Eyebrow: "TRANSPARENT PRICING"
Headline: "Built by Students, For Students"
Subheadline: "Attendrix is currently in Public Beta (Invite-Only).
              Premium tier launching Q2 2026."
```

#### 3.5.3 Tier 1: Attendrix (Free) Card

**Visual Design**

```
Border: 3px solid #4ECDC4
Background: #FFFFFF
Header Background: #4ECDC4 (light gradient)
Icon: Pixelated "Student" badge
```

**Content**

```
Tier Name: "Attendrix (Pilot)"
Typography: Space Mono, 32px, Bold

Price: "FREE"
Typography: VT323, 48px
Subtext: "Invite-Only Access"
Typography: DM Sans, 14px, #64748B

Features List:
━━━━━━━━━━━━━━━━━━━━━━━━
✓ Full Subject-Wise Tracking
  → Medical Condonation
  → Safe Cut Calculator
  → Critical Alerts

✓ Amplix Gamification
  → Mage Ranks (Lvl 1-12)
  → Daily Challenges
  → Streak Tracking

✓ Lumen AI (Standard)
  → Powered by Gemini 2.5 Flash Lite
  → Syllabus Q&A (5 PDFs max)
  → Telegram access

✓ Google Calendar Sync
  → Real-time updates
  → Core + Elective routing

✓ Offline-First Architecture
  → Local-first writes
  → Auto-sync on reconnect

━━━━━━━━━━━━━━━━━━━━━━━━
```

**CTA**

```
Label: "Request Batch Access"
Style: Outlined RetroUI button (Teal)
Action: Opens form/email: onboarding@attendrix.app
```

---

#### 3.5.4 Tier 2: Attendrix Premium Card

**Visual Design**

```
Border: 3px solid #A78BFA
Background: Linear gradient (very subtle): #FFFFFF → #F3F0FF
Header Background: #A78BFA
Icon: Pixelated crown or star
Badge: "COMING SOON" (amber #FFD93D, top-right corner)
```

**Content**

```
Tier Name: "Attendrix Premium"
Typography: Space Mono, 32px, Bold

Price: "₹99/semester"
Typography: VT323, 48px
Subtext: "Launching Q2 2026"
Typography: DM Sans, 14px, #64748B

Everything in Free, PLUS:
━━━━━━━━━━━━━━━━━━━━━━━━
★ Lumen AI (Advanced)
  → GPT-4o, Claude, Gemini Pro via OpenRouter
  → Unlimited syllabus uploads
  → Larger context windows (128k tokens)
  → Code debugging assistance

★ Priority Features
  → Early access to beta features
  → Custom notification schedules
  → Bulk attendance import/export

★ Premium Support
  → Direct developer access
  → 24-hour response time
  → Feature request priority

★ Personal Repository (Cloud)
  → 5GB storage for notes/PDFs
  → Cross-device sync
  → OCR text extraction

━━━━━━━━━━━━━━━━━━━━━━━━
```

**Value Proposition**

```
"Advanced intelligence for serious academics. Less than ₹20/month."
Typography: DM Sans, 16px, Italic, #64748B
```

**CTA**

```
Label: "Notify Me at Launch"
Style: Solid RetroUI button (Purple)
Action: Email capture form (validated)
```

---

#### 3.5.5 Comparison Table (Optional Enhancement)

If space allows, add a detailed feature matrix below the cards:

```
| Feature | Free | Premium |
|---------|------|---------|
| Subject-Wise Tracking | ✓ | ✓ |
| Lumen AI Model | Flash Lite | GPT-4o/Claude |
| Syllabus Upload Limit | 5 PDFs | Unlimited |
| Calendar Sync | ✓ | ✓ |
| Amplix Gamification | ✓ | ✓ + Exclusive Challenges |
| Cloud Storage | 0GB | 5GB |
| Support Response | Community | <24hrs Direct |
| Custom Themes | - | ✓ |
```

Style: RetroUI table with thick borders, alternating row colors

---

### Section 6: FAQ & Support

#### 3.6.1 Layout Structure

**Pattern**: Accordion component (collapsible Q&A)
**Desktop**: Two-column grid (questions split 50/50)
**Mobile**: Single column stack

#### 3.6.2 Section Header

```
Headline: "Questions? We've Got Answers."
Typography: VT323, 48px
Subheadline: "If you don't see your question, hit us up on Telegram."
```

#### 3.6.3 Accordion Component Design

**Closed State**

```
Container:
- Border: 2px solid #000000
- Background: #FFFFFF
- Padding: 20px 24px
- Shadow: 3px 3px 0px #000000

Header:
- Typography: Space Mono, 18px, Bold
- Icon: "+" (pixelated, right-aligned)
- Cursor: pointer

Hover: Slight background color shift (#F8F9FA)
```

**Open State**

```
Icon: "+" rotates to "-"
Body Text:
- Typography: DM Sans, 16px, Line-height: 1.7
- Padding: 16px 24px 24px
- Border-top: 2px dashed #E5E7EB (separator)

Animation: Smooth height expansion (300ms ease-in-out)
```

#### 3.6.4 FAQ Content

**Q1: Is this official NITC software?**

```
Answer:
"No. Attendrix is an independent student project, not affiliated with
the institute's administration.

However, we've reverse-engineered the Institute's Slot System and
attendance policies to ensure 100% compliance. Every calculation
(Subject-Wise %, Medical Condonation, Safe Cuts) mirrors how the
Academic Section computes eligibility.

Think of us as a 'Policy-Aware Mirror'—we show you what the institute
sees, just faster and friendlier."
```

**Q2: How does the 'Safe Cut' calculator work?**

```
Answer:
"It's simple math, but Attendrix does it live:

Formula:
Safe Cuts = ((Current% × Classes Held) - (80% × Total Expected)) / 20%

Example:
- You have 85% in Thermodynamics
- 20 classes held, 25 expected by semester end
- Calculation: ((0.85 × 20) - (0.80 × 25)) / 0.20 = -0.5

Result: You're already at risk. Can't miss any more.

The dashboard shows this as: 'Critical - Attend next 5 classes'

Medical leaves automatically adjust the denominator, so condonation
is factored into the safe cut."
```

**Q3: What happens if I delete an attendance record?**

```
Answer:
"Great question—this is where Amplix's Anti-Cheat kicks in.

Scenario: You accidentally marked yourself present for a class you
skipped. You delete that record to fix your percentage.

What happens:
1. Attendance % recalculates correctly ✓
2. Any XP earned from that specific check-in is revoked ✗
3. If that check-in was part of a streak, the streak resets ✗
4. Challenge progress tied to that class is rolled back ✗

Why? Gamification should reward genuine discipline, not database edits.

Your rank stays honest."
```

**Q4: How do I get my batch onboarded?**

```
Answer:
"Attendrix rolls out batch-by-batch to ensure quality.

If your batch isn't onboarded yet:
1. Nominate a Batch Representative (CR or volunteer)
2. Email us: onboarding@attendrix.app
3. We'll send a setup form (needs: Batch ID, Semester, Core Courses)
4. Setup takes 48-72 hours
5. You'll get an invite link to download the APK

Current status: S4 Mechanical, S6 Computer Science (Batch A), and
S8 Electrical are live. More coming weekly."
```

**Q5: Does Lumen have access to my personal data?**

```
Answer:
"No. Lumen only reads:
- Your timetable (which classes you have)
- Your uploaded syllabi (PDFs you choose to share)
- Your attendance records (to answer 'status' queries)

Lumen does NOT see:
- Your personal notes (unless you explicitly upload them)
- Other students' data (fully isolated)
- Your Google Calendar content

All AI interactions are logged locally for debugging, but never shared
with third parties. We don't train models on your conversations."
```

**Q6: Why APK and not Play Store?**

```
Answer:
"Attendrix is currently in Public Beta (pilot testing). We're using
APK distribution to iterate fast without Play Store review delays.

Once we hit v2.0 (stable release), we'll launch on:
- Google Play Store (Android)
- TestFlight → App Store (iOS, in development)

For now, APK lets us ship updates within hours, not weeks."
```

**Q7: Is my data safe? What if Attendrix shuts down?**

```
Answer:
"Data security & portability:

Storage:
- Attendance records: Firebase Firestore (Google-backed, 99.99% uptime)
- User profiles: Supabase PostgreSQL (encrypted at rest)
- Backups: Daily snapshots to AWS S3

Your rights:
- Export all data as CSV anytime (Settings → Export Data)
- Delete account & all records (GDPR-compliant)
- If we shut down, we'll release a 'final export' tool 30 days prior

We're students, not a startup chasing exit. This is a public utility
project. Code is open-source on GitHub (MIT License). You can self-host
if needed."
```

**Q8: Can I use Attendrix for multiple semesters?**

```
Answer:
"Absolutely. Your data persists across semesters.

When a new semester starts:
1. Archive previous semester's courses (Settings → Archive) (Feature still in development.)
2. Add new timetable (manual or import)
3. Old attendance stays in history for reference
4. Amplix XP and Mage Rank carry over

You'll have a complete academic transcript by graduation."
```

---

### Section 7: Footer

#### 3.7.1 Layout Structure

**Pattern**: Multi-column grid
**Desktop**: 4 columns (About | Resources | Legal | Social)
**Mobile**: Stacked sections with collapsible headers

**Background**: #2D2D2D (inverted dark theme)
**Text Color**: #FDFBF7 (cream/off-white)
**Borders**: #FFFFFF (white borders for contrast)

#### 3.7.2 Column 1: About Attendrix

**Content**

```
Header: "About Attendrix"
Typography: Space Mono, 16px, Bold

Body:
"A precision academic tool built by NIT Calicut students, for students.
Subject-Wise tracking, AI-powered assistance, and gamified engagement—
engineered to match institutional reality."

Version Badge:
"v1.3.2 (Public Beta)"
Style: Small pill badge with border
Color: #4ECDC4
```

#### 3.7.3 Column 2: Quick Links

**Header**: "Resources"

**Links**:

```
- Documentation (→ Notion/GitBook)
- GitHub Repository (→ github.com/attendrix)
- API Status (→ status.attendrix.app)
- Feature Roadmap (→ Public Trello board)
- Student Testimonials

Each link:
- Typography: DM Sans, 14px
- Hover: Underline + color shift to #4ECDC4
- Icon: Small arrow (→) suffix
```

#### 3.7.4 Column 3: Legal & Privacy

**Header**: "Legal"

**Links**:

```
- Privacy Policy (PDF, version-dated)
- Terms of Service
- Data Export Guide
- Open Source License (MIT)
- Security Disclosures

Note: "Privacy Policy Last Updated: Dec 2025"
Typography: 12px, #94A3B8
```

#### 3.7.5 Column 4: Support & Social

**Header**: "Get Help"

**Links**:

```
- Telegram Support Bot (→ @AttendrixSupport)
- Email: support@attendrix.app
- Report a Bug (→ GitHub Issues)
- Request a Feature
```

**Social Icons**:

```
- GitHub (→ Repository)
- Telegram (→ Community Channel)
- LinkedIn (→ Team profiles)

Icon Style: Monochrome line icons, 24px, hover: #4ECDC4 fill
```

#### 3.7.6 Footer Bottom Bar

**Layout**: Full-width stripe below columns

**Left**: Copyright

```
"© 2026 Attendrix. Dreamt, Designed, and Built with <3 By NITC Students."
Typography: DM Sans, 14px
Icon: Pixelated heart for "<3"
```

**Center**: Status Badge

```
"System Status: ● All Systems Operational"
Color: Green dot (#6BCF7F) + text
Links to: status.attendrix.app
```

**Right**: Credits

```
"Design: RetroUI · Powered by Supabase + Firebase"
Typography: Space Mono, 12px
Links: Subtle underline on hover
```

---

## 4. Interactions & Animations

### 4.1 Page Load Sequence

```
1. Hero Section (0ms): Fade-in + slight upward slide (800ms ease-out)
2. Headline (200ms delay): Glitch effect (500ms)
3. CTA Buttons (400ms delay): Pop-in with bounce (600ms)
4. Monitor Visual (600ms delay): "Power-on" effect (1200ms)
5. Subsequent Sections: Staggered fade-in on scroll (intersection observer)
```

### 4.2 Scroll-Triggered Animations

- **Feature Cards**: Slide-in from bottom with shadow growth (trigger: 20% in viewport)
- **Terminal Window**: Typewriter text animation (trigger: 50% in viewport)
- **Stats/Metrics**: Count-up animation (e.g., 0 → 12,000) (trigger: in viewport)

### 4.3 Hover Interactions

- **Buttons**: Shadow reduction + translate (as per RetroUI spec)
- **Cards**: Slight lift (transform: translateY(-4px)) + shadow intensify
- **Links**: Underline slide-in (left to right, 200ms)
- **Accordion**: Background color subtle shift

### 4.4 Mobile-Specific Interactions

- **Tap Feedback**: Brief scale-down (0.98) on touch
- **Swipe**: Horizontal swipe on Feature Grid (carousel mode on mobile)
- **Sticky CTA**: "Download APK" button sticks to bottom on scroll (z-index: 50)

---

## 5. Technical Implementation Notes

### 5.1 Performance Budget

| Metric                   | Target |
| ------------------------ | ------ |
| First Contentful Paint   | <1.5s  |
| Largest Contentful Paint | <2.5s  |
| Time to Interactive      | <3.5s  |
| Cumulative Layout Shift  | <0.1   |
| Total Page Weight        | <1.2MB |

### 5.2 Asset Optimization

- **Images**: WebP format with AVIF fallback
- **Icons**: Inline SVGs where possible (reduce HTTP requests)
- **Fonts**: Subset fonts (Latin only), preload critical fonts
- **Code Splitting**: Lazy-load below-the-fold sections (React.lazy)

### 5.3 SEO Requirements

```html
<title>Attendrix - Subject-Wise Attendance Tracker for NIT Calicut</title>
<meta
  name="description"
  content="Policy-compliant academic management. Subject-Wise tracking, AI-powered syllabus assistant (Lumen), gamified engagement (Amplix). Built by NITC students."
/>
<meta
  name="keywords"
  content="NIT Calicut, attendance tracker, subject-wise, Lumen AI, academic management, NITC students"
/>
<link rel="canonical" href="https://attendrix.vercel.app" />

<!-- Open Graph -->
<meta property="og:title" content="Attendrix - Attendance Reimagined" />
<meta
  property="og:description"
  content="The only tracker built for NIT Calicut's Slot System."
/>
<meta property="og:image" content="https://attendrix.vercel.app/og-image.png" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Attendrix - Subject-Wise Tracking" />
<meta
  name="twitter:description"
  content="Policy-compliant. Gamified. Student-built."
/>
<meta
  name="twitter:image"
  content="https://attendrix.vercel.app/twitter-card.png"
/>
```

### 5.4 Analytics Events to Track

```javascript
// Hero Section
- apk_download_hero (click)
- telegram_open_hero (click)

// Navigation
- scroll_depth (25%, 50%, 75%, 100%)
- section_view (hero, features, lumen, pricing, faq)

// Engagement
- faq_open (question_id)
- feature_card_hover (feature_name)
- pricing_cta_click (tier)

// Conversions
- apk_download_complete
- batch_access_request
- premium_notify_me
```

### 5.5 Accessibility (WCAG 2.1 AA)

- **Contrast Ratios**: All text meets 4.5:1 minimum (7:1 for headers)
- **Keyboard Navigation**: Full tab-order support, visible focus indicators
- **Screen Readers**: Semantic HTML, ARIA labels on icons/buttons
- **Alternative Text**: Descriptive alt text for all images
- **Animation**: Respect `prefers-reduced-motion` media query

---

## 6. Content Strategy & Voice

### 6.1 Brand Voice Attributes

```
Primary: Confident, Precise, Student-Centric
Secondary: Playful (gamification), Transparent (technical honesty)
Avoid: Corporate jargon, exaggeration ("revolutionary", "game-changing"), condescension
```

### 6.2 Writing Guidelines

- **Specificity over Generality**: Use "80% per subject" not "high attendance"
- **Technical Honesty**: Mention "LangChain," "Edge Functions," "Exponential Backoff"—own the engineering
- **Student Language**: "Batch," "Slot," "Safe Cut" (institutional terms)
- **Clarity**: Avoid acronyms without definition (first use: "RAG (Retrieval Augmented Generation)")

### 6.3 Microcopy Standards

```
Buttons:
- Primary CTA: Action verbs ("Download", "Chat", "Request")
- Secondary: Exploratory ("Learn More", "See Details")

Error States:
- "Oops, something broke. Try refreshing?" (not "Error 500")

Success States:
- "APK Downloaded! Check your notifications."

Loading States:
- "Syncing your schedule..." (not "Loading...")
```

---

## 7. Launch Checklist

### 7.1 Pre-Launch

- [ ] All links tested (APK download, Telegram, GitHub, email)
- [ ] Mobile responsive checked on 5+ devices (iOS Safari, Chrome Android)
- [ ] Analytics configured (GA4, Mixpanel, or Plausible)
- [ ] SEO meta tags validated (Twitter Card Preview, FB Debugger)
- [ ] Legal pages uploaded (Privacy Policy PDF with version date)
- [ ] Accessibility audit complete (Lighthouse score >90)
- [ ] Performance budget met (Pagespeed Insights)

### 7.2 Post-Launch Monitoring

- [ ] Track bounce rate (target: <40%)
- [ ] Monitor APK download funnel (hero → download → install)
- [ ] A/B test CTA copy ("Download APK" vs. "Get Attendrix")
- [ ] Collect user feedback (embedded Typeform or Tally)
- [ ] Setup uptime monitoring (UptimeRobot for status page)

---

## 8. Future Enhancements (Post-v1)

### 8.1 Interactive Demos

- **Live Calculator**: Embed a "Try Safe Cut Calculator" widget (input classes, see output)
- **Lumen Playground**: Embedded chat window with pre-loaded sample syllabus

### 8.2 Social Proof

- **Student Testimonials**: Video snippets or quote cards with batch ID
- **Usage Stats**: Live counter ("1,247 students onboarded", updated via API)

### 8.3 Localization

- **Regional Language Support**: Hindi, Malayalam (toggle in footer)

### 8.4 Dark Mode

- RetroUI Dark Theme variant (toggle in top-right corner)

---

## 9. Sign-Off & Approval

| Role               | Name   | Date   | Status       |
| ------------------ | ------ | ------ | ------------ |
| Product Owner      | [Name] | [Date] | [ ] Approved |
| Design Lead        | [Name] | [Date] | [ ] Approved |
| Engineering Lead   | [Name] | [Date] | [ ] Approved |
| Content Strategist | [Name] | [Date] | [ ] Approved |

---

## Appendix A: Terminology Glossary

| Term                    | Definition                                                     |
| ----------------------- | -------------------------------------------------------------- |
| **Subject-Wise**        | Independent attendance tracking per course, not aggregate      |
| **Slot System**         | NITC's coded time blocks (A1, B2, C1...) for timetable mapping |
| **Amplix**              | Gamification engine (XP, Mage Ranks, Challenges)               |
| **Lumen**               | LangChain-powered AI assistant (syllabus Q&A)                  |
| **Safe Cut**            | Calculated max classes a student can miss while staying ≥80%   |
| **Medical Condonation** | Adjustment to denominator for institute-approved absences      |
| **RAG**                 | Retrieval Augmented Generation (AI with document context)      |
| **Edge Functions**      | Serverless compute (Supabase) for calendar sync logic          |

---

**End of PRD**

This document serves as the single source of truth for the Attendrix Showcase Website build. All implementation decisions should reference this PRD. For clarifications, contact: <product@attendrix.app>
