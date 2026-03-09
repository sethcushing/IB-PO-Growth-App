# PO Growth App - Product Requirements Document

## Original Problem Statement
Build an internal Product Owner growth assessment tool measuring PO capabilities using a 360° feedback model with 3 parallel questionnaires (Self, Business Partner, Manager), Executive Dashboard with visualizations, and role-based access control.

## User Choices & Evolution
- JWT authentication with demo accounts
- Skip PDF exports (CSV only)
- Chart.js for visualizations
- No email notifications
- Auto-seeded demo data for executive POC
- **Updated**: Changed terminology from "Maturity" to "Growth" throughout
- **Updated**: Added coaching recommendations to scorecards
- **Updated**: Made questionnaire language more personable and conversational
- **Updated**: Changed rubric labels to friendlier options (Not yet, Sometimes, Usually, Often, Always)

## Architecture
- **Frontend**: React with Tailwind CSS, Chart.js/react-chartjs-2, shadcn/ui components
- **Backend**: FastAPI with MongoDB via Motor
- **Auth**: JWT tokens with bcrypt password hashing
- **Styling**: Lime green accent, glassmorphism, Lato font

## User Personas & Roles (RBAC)
1. **Admin** - Full access: manage questions, weights, assignments, cycles, exports
2. **ExecViewer** - Read-only dashboards across org
3. **Manager** - Assess assigned POs, view team scorecards
4. **ProductOwner** - Complete self-assessment, view own scorecard
5. **AgileCoach** - Complete coach assessments for assigned POs

## Core Requirements
- 8 dimensions with weighted scoring (sum = 100)
- 40 questions (5 per dimension) with 1-5 rubric scale
- Growth levels: Foundational (0-24), Developing (25-44), Performing (45-64), Leading (65-84), Elite (85-100)
- Alignment Index: 100 - avg(absolute deltas)
- Confidence Score based on partner count and completion

## What's Been Implemented (March 2025)

### Phase 1 - Core Infrastructure
- [x] Simplified sign-in landing page (internal app)
- [x] JWT authentication with demo accounts
- [x] Dashboard with role-based quick actions
- [x] Assessment questionnaire with rubric selector
- [x] View completed assessments with scores
- [x] Individual PO scorecards with radar charts
- [x] Manager team view
- [x] Executive dashboard with KPIs, radar, scatter, heatmap
- [x] Admin console with dimensions/questions/users
- [x] CSV export
- [x] Demo data seeding (12 POs, 3 teams, realistic patterns)
- [x] Historical data viewing with cycle selector

### Phase 2 - UI/UX Overhaul (Completed March 2025)
- [x] Changed app name to "PO Growth App"
- [x] Changed "Maturity" terminology to "Growth" throughout
- [x] Updated GrowthBadge component with TrendingUp icon
- [x] Enhanced glassmorphism styling
- [x] Lato font applied globally

### Phase 3 - Coaching & Personalization (Completed March 2025)
- [x] Added coaching recommendations to scorecard pages
- [x] Recommendations based on dimension scores and alignment gaps
- [x] Updated questionnaire language to be more personable
- [x] Changed rubric labels: Not yet, Sometimes, Usually, Often, Always
- [x] Fixed "What does this mean?" popover for question guidance
- [x] Added helpful, contextual guidance text for each dimension

## Demo Accounts
- **Admin**: admin@company.com / demo123
- **ExecViewer**: exec@company.com / demo123
- **Manager**: james.chen@company.com / demo123
- **ProductOwner**: alex.johnson@company.com / demo123
- **AgileCoach**: lisa.wang@company.com / demo123

## Prioritized Backlog

### P0 (Critical) - DONE
- All core flows implemented

### P1 (High)
- Add ability to create new assessment cycles
- Assignment management UI for admins
- Edit dimension weights

### P2 (Medium)
- Comment visibility toggles
- Audit logging

### P3 (Low)
- Email notifications
- PDF export
- Historical trend analysis

## File Structure
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py (monolithic API with seeding)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MaturityBadge.js (renamed to GrowthBadge)
│   │   │   ├── Layout.js
│   │   │   ├── DeltaChip.js
│   │   │   └── charts/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ScorecardPage.js (with coaching recommendations)
│   │   │   ├── AssessmentPage.js (with personable questions)
│   │   │   ├── ManagerPage.js
│   │   │   ├── ExecutivePage.js
│   │   │   └── AdminPage.js
│   │   └── index.css (glassmorphism styles)
│   └── tailwind.config.js
└── memory/
    └── PRD.md
```

## Next Tasks
1. Add assignment creation/management in Admin console
2. Implement audit logging for admin changes
3. Add comment visibility toggles
