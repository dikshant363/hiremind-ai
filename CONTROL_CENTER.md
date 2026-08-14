# HIREMIND CONTROL CENTER — Non-Technical Platform Administration

The **HireMind Control Center** enables complete customization, configuration, and monitoring of HIREMIND AI without touching source code, terminal commands, database consoles, or JSON files.

---

## Accessing the Control Center

1. Click the **Control Center (Settings)** icon in the top-right navigation header or press `Ctrl + /` (or `Cmd + /`) to open the Command Palette and select **Control Center**.
2. If you are signed in as an **Admin**, all configuration controls are fully unlocked with **Save Changes**, **Cancel**, and **Reset to Default** actions.
3. If signed in as a standard user or guest, the Control Center presents read-only diagnostics with permission notices.

---

## Administration Modules & Capabilities

### 1. Overview & System Health
- **Live Diagnostics**: Real-time ping and latency measurements for SQLite database, AI inference providers, document text extractors, and Node.js process memory.
- **Database Status**: Displays active sessions, registered users, and total audit logs.
- **Configuration Snapshot**: High-level summary of active brand name, accent color theme, default interview difficulty, and enabled feature flags.

### 2. Brand Customization
- **Product Name & Tagline**: Change platform identity (e.g., from `HireMind AI` to `CampusHire AI`) across all navigation headers, footers, page titles, and reports.
- **Live Preview Window**: Real-time preview shows exactly how the branding renders before saving.
- **Safe Persistence**: Changes are committed to SQLite via `/api/config` and immediately propagated across all active user sessions without rebuilding.

### 3. Appearance & Design Tokens
- **Theme Accents**: Select from curated color palettes:
  - `Blue` (Ocean Precision)
  - `Indigo` (Deep Enterprise)
  - `Violet` (Modern Royal)
  - `Emerald` (Growth & Success)
  - `Amber` (Warm Energy)
  - `Rose` (Dynamic Vibrant)
- **Token Cascade**: Modifies CSS variables (`--color-primary`, `--primary-accent`, glow rings, badges, graphs, and buttons) instantly.

### 4. AI Provider & Resilience
- **Provider Abstraction**: Switch or inspect active AI providers (`Gemini`, `OpenAI`, `Anthropic`, `Deterministic Heuristic Engine`).
- **Resilience Strategy**: Automatic fallback ensures 100% platform uptime even if external AI APIs experience latency or rate limits.

### 5. Adaptive Interview Configuration
- **Default Difficulty**: Set baseline question complexity (`Auto`, `Easy`, `Medium`, `Hard`).
- **Adaptive Pivoting**: Toggle dynamic weakness-driven questioning on/off.
- **Question Volume**: Adjust interview length from 3 to 7 questions per mock session.

### 6. Scoring & Readiness Weights
- **Prototype Match Index Weights**:
  - Required Skill Alignment (default: 40%)
  - Evidence Strength (default: 30%)
  - Semantic Relevance (default: 20%)
  - Coverage Breadth (default: 10%)
- **100% Sum Enforcement**: Visual validation prevents saving invalid weight totals with immediate guidance.
- **Job Readiness Index Weights**:
  - Job Alignment (default: 30%)
  - Required Coverage (default: 25%)
  - Interview Evidence (default: 20%)
  - Technical Readiness (default: 15%)
  - Communication (default: 10%)

### 7. Skills Taxonomy Management
- **Add / Edit / Remove Skills**: Add custom skills with category groupings (Programming, Cloud, AI/ML, Databases, DevOps) and recognized aliases.
- **Real-Time Normalization**: Extractor instantly normalizes candidate resumes and job descriptions against the updated taxonomy.

### 8. Custom Job Role Templates
- **Role Management**: Add, update, or archive role templates with custom descriptions, required competencies, and experience levels.

### 9. Feature Flags
- **Toggle Features**: Dynamically enable or disable:
  - Voice Input / Speech Recognition
  - Presentation Mode (High Contrast & Large Typography)
  - Candidate Compare View (A/B Delta Inspection)
  - Gamified Achievements & Skill Badges
  - Demo Mode Shortcut
  - AI Polish

### 10. Data & Audit Trail
- **Data Export**: Export complete session database to structured JSON.
- **Audit Activity Log**: Searchable trail of administrative updates with timestamps, user IDs, and action categories.
