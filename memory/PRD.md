# APO Product Owner Assessment Tool - PRD

## Original Problem Statement
Build a modern, highly-visual assessment product measuring Product Owner (PO) maturity using a consulting-style scoring model with 3 parallel questionnaires (Self, Business Partner, Manager), Executive Dashboard with heatmaps/radar charts, and RBAC.

## User Choices
- JWT authentication with demo toggle
- Skip PDF exports (CSV only)
- Chart.js for visualizations
- No email notifications
- Auto-seeded demo data for executive POC

## Architecture
- **Frontend**: React with Tailwind CSS, Chart.js/react-chartjs-2, shadcn/ui components
- **Backend**: FastAPI with MongoDB via Motor
- **Auth**: JWT tokens with bcrypt password hashing
- **Styling**: Lime green accent, glassmorphism, Outfit/Plus Jakarta Sans fonts

## User Personas & Roles (RBAC)
1. **Admin** - Full access: manage questions, weights, assignments, cycles, exports
2. **ExecViewer** - Read-only dashboards across org
3. **Manager** - Assess assigned POs, view team scorecards
4. **ProductOwner** - Complete self-assessment, view own scorecard
5. **BusinessPartner** - Complete partner assessments for assigned POs

## Core Requirements
- 8 dimensions with weighted scoring (sum = 100)
- 40 questions (5 per dimension) with 1-5 rubric scale
- Maturity bands: Foundational (0-24), Developing (25-44), Performing (45-64), Leading (65-84), Elite (85-100)
- Alignment Index: 100 - avg(absolute deltas)
- Confidence Score based on partner count and completion

## What's Been Implemented (March 2025)
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

## Prioritized Backlog
### P0 (Critical) - DONE
- All core flows implemented

### P1 (High)
- Add ability to create new assessment cycles
- Assignment management UI for admins
- Edit dimension weights

### P2 (Medium)
- Coaching recommendations based on score bands
- Comment visibility toggles
- Audit logging

### P3 (Low)
- Email notifications
- PDF export
- Historical trend analysis

## Next Tasks
1. Add assignment creation/management in Admin
2. Implement coaching recommendations engine
3. Add audit logging for admin changes
