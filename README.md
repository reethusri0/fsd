# LEARNZONE ULTRA — Complete Product Specifications

An educational operating system and student learning workspace engineered with luminous editorial art direction, dynamic academic telemetry, command-palette navigation, and client-side persistence.

---

## 1. Visual & Creative Direction: Luminous Editorial

LearnZone Ultra pairs structured editorial typography (`Plus Jakarta Sans` and `Space Grotesk`) with luminous, modern surfaces and fluid micro-interactions.

- **Theme Palette:**
  - **Luminous Editorial (Light):** Canvas `#F8FAFC`, ambient radial gradients, crisp glassmorphic surfaces, deep slate typography.
  - **Midnight Obsidian (Dark):** Deep graphite/obsidian `#0B0F19`, luminescent accents, high-contrast typography, and dark-mode-adapted charts.
- **Motion Principles:**
  - Fluid spring physics (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Floating mockups, subtle glow pulses, and staggered entrance sequences (`.animate-entrance`).
  - Native reduced-motion compliance via CSS media query fallbacks.

---

## 2. Features & Route Specifications

| Route | Page Name | Key Features |
|---|---|---|
| `/index.html` | **Landing Page** | Editorial hero, live interactive workspace preview frame, feature cards, and instant auth routing. |
| `/login.html` | **Sign In** | Split editorial layout, password visibility toggle, accessible inline validation, and session initialization. |
| `/register.html` | **Enrollment** | Responsive multi-column layout, DOB/Age validation, contact number checks, and auto-login upon registration. |
| `/forgot-password.html` | **Recovery** | Transparent demo notice, email validation, and simulated verification link response. |
| `/home.html` | **Academic Hub** | Personalized greeting, telemetry metric cards, upcoming deliverables pipeline, and peer discussion stream. |
| `/dashboard.html` | **Intelligence Dashboard** | Chart.js telemetry curves, domain proficiency radar, and milestone status breakdown table. |
| `/performance.html` | **Academic Analytics** | Cumulative GPA index, cohort ranking, historical examination grades, and trajectory curves. |
| `/assignments.html` | **Coursework Deliverables**| Status filters (All, Pending, Submitted, Overdue), live search, deadline warning flags, and modal confirmation submissions. |
| `/queries.html` | **Discussions** | Discussion thread creation with domain tags, live query search, peer upvotes, author deletion with confirm dialogs, and XSS sanitization. |

---

## 3. Command Palette System (`⌘K` / `Ctrl+K`)

LearnZone Ultra features a global command palette accessible on every authenticated route:
- Press **`⌘K`** (macOS) or **`Ctrl+K`** (Windows/Linux) or click the topbar search bar.
- Instantly search routes, jump between workspaces, or press **`ESC`** to dismiss.

---

## 4. Local Deployment & Verification

A dedicated Node.js static HTTP server is deployed and running locally:

```powershell
# Start local server (Port 5500)
node server.js
```

### Access URL:
👉 **[http://127.0.0.1:5500](http://127.0.0.1:5500)**

### Run Automated Tests:
```powershell
node test.js
```
*Current test suite status: 30 passed, 0 failed.*

---

## 5. Security & Persistence Model

- **Client-Side Simulation:** Data is scoped and stored in `localStorage` (`lzu_users`, `lzu_assignments`, `lzu_queries`, `lzu_theme`) and `sessionStorage` (`lzu_session`).
- **Demo Security Boundary:** Passwords are encoded using client-side base64 obfuscation for testing purposes. Production deployment requires server-side Bcrypt/Argon2 hashing and JWT/Cookie authorization.
