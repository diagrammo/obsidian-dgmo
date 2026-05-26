# Diagrammo Chart Examples

> Every code fence below renders a different chart type. Edit the data inline to experiment.
> Full language reference, more chart types, and the desktop editor at [diagrammo.app/docs](https://diagrammo.app/docs).

## Contents

**Data** — [Arc](#arc) · [Area](#area) · [Bar](#bar) · [Bar Stacked](#bar-stacked) · [Chord](#chord) · [Doughnut](#doughnut) · [Function](#function) · [Heatmap](#heatmap) · [Line](#line) · [Multi-Line](#multi-line) · [Pie](#pie) · [Polar Area](#polar-area) · [Radar](#radar) · [Scatter](#scatter) · [Slope](#slope)

**Business** — [Cycle](#cycle) · [Funnel](#funnel) · [Journey Map](#journey-map) · [Org Chart](#org-chart) · [Pyramid](#pyramid) · [Quadrant](#quadrant) · [Ring](#ring) · [Sankey](#sankey) · [Tech Radar](#tech-radar) · [Venn](#venn) · [Word Cloud](#word-cloud)

**Project** — [DACI](#daci) · [Gantt](#gantt) · [Kanban](#kanban) · [PERT](#pert) · [RACI](#raci) · [RASCI](#rasci) · [Timeline](#timeline)

**Software** — [Boxes and Lines](#boxes-and-lines) · [C4 Architecture](#c4-architecture) · [Class Diagram](#class-diagram) · [Entity-Relationship](#entity-relationship) · [Flowchart](#flowchart) · [Infrastructure](#infrastructure) · [Mindmap](#mindmap) · [Sequence](#sequence) · [Sitemap](#sitemap) · [State Machine](#state-machine) · [Wireframe](#wireframe)

---

# Data

## Arc

```dgmo
arc Microservice Dependencies

[Frontend] blue
  WebApp -> APIGateway: 5
  MobileApp -> APIGateway: 3

[Core Services] green
  APIGateway -> AuthService: 4
  APIGateway -> UserService: 5
  APIGateway -> OrderService: 3
  UserService -> Database: 4
  OrderService -> Database: 3
  OrderService -> PaymentService: 2

[External] orange
  PaymentService -> Stripe: 2
  AuthService -> OAuth: 3
```

---

## Area

```dgmo
area Memory Usage Over Day
series GB
x-label Hour

era 9am -> 5pm Business Hours blue

12am 2.1
3am  1.8
6am  2.4
9am  5.7
12pm 7.1
3pm  6.8
6pm  4.2
9pm  3.1
11pm 2.5
```

---

## Bar

```dgmo
bar Monthly Revenue by Product
solid-fill
series Revenue ($K)

Enterprise   245
Professional 182
Starter       97
Free Trial    43
Add-ons       61
Consulting   128
```

---

## Bar Stacked

```dgmo
bar-stacked Support Tickets by Priority
solid-fill
series
  Critical red
  High orange
  Medium yellow
  Low green
x-label Month
y-label Tickets

January   8 24 45 62
February 12 19 51 58
March     6 22 38 71
April    10 28 42 65
May       5 15 48 70
```

---

## Chord

```dgmo
chord Inter-Department Collaboration

Engineering -- Design 85
Engineering -- Product 72
Engineering -- QA 95
Design -- Product 68
Design -- Marketing 45
Product -- Marketing 58
Product -- Sales 42
Marketing -- Sales 65
QA -- Engineering 88
Sales -- Product 30
```

---

## Doughnut

```dgmo
doughnut Cloud Spending by Service
solid-fill

Compute blue        34
Storage cyan        22
Database green      18
Networking orange   12
AI/ML purple         8
Other gray           6
```

---

## Function

```dgmo
function Trigonometric Reference
x-label x
y-label f(x)
x -6 to 6

sin(x) blue: sin(x)
cos(x) green: cos(x)
x²/10 red: x^2 / 10
```

---

## Heatmap

```dgmo
heatmap Deploy Frequency by Day and Hour
columns Mon, Tue, Wed, Thu, Fri

6 AM   1 2 0 1 0
9 AM   5 8 6 7 4
12 PM  3 4 5 3 2
3 PM   8 12 9 10 6
6 PM   2 3 1 2 1
```

---

## Line

```dgmo
line Daily Active Users (Q1)
series Users (thousands)
x-label Week

era Week 1 -> Week 4 Soft Launch orange
era Week 5 -> Week 12 Public Beta blue

Week 1  12.4
Week 2  13.1
Week 3  14.8
Week 4  13.9
Week 5  16.2
Week 6  17.5
Week 7  18.1
Week 8  19.3
Week 9  21.0
Week 10 22.4
Week 11 24.1
Week 12 23.8
```

---

## Multi-Line

```dgmo
line Quarterly Revenue vs Cost
series Revenue blue, Operating Cost red, Net Profit green
x-label Quarter

Q1 2024 4.2 3.1 1.1
Q2 2024 4.8 3.3 1.5
Q3 2024 5.1 3.5 1.6
Q4 2024 5.9 3.7 2.2
Q1 2025 6.3 3.9 2.4
Q2 2025 7.1 4.2 2.9
```

---

## Pie

```dgmo
pie Browser Market Share
solid-fill

Chrome   63.5
Safari   19.8
Firefox   6.2
Edge      5.1
Samsung   2.8
Opera     1.4
Other     1.2
```

---

## Polar Area

```dgmo
polar-area Incident Categories (Last 30 Days)
solid-fill

Security       12
Performance    28
Availability    8
Data Loss       3
Configuration  19
Network        15
```

---

## Radar

```dgmo
radar Engineering Team Skills
solid-fill

Frontend       85
Backend        72
DevOps         68
Testing        90
Documentation  55
Architecture   78
```

---

## Scatter

```dgmo
scatter Startup Funding vs Revenue
x-label Funding ($M)
y-label Annual Revenue ($M)

[SaaS] blue
  Acme Cloud  12   8.5
  DataSync     5.2 3.1
  CloudOps    25  18.4
  PlatformX    8   5.7

[Fintech] green
  PayFlow     45  32
  LendTech    18  12.5
  QuickPay     9   6.8

[HealthTech] red
  MediScan    15   7.2
  HealthAI    22  14.1
  CareLink     7   3.8
```

---

## Slope

```dgmo
slope Programming Language Popularity

period
  2020
  2025

Python blue       3  1
JavaScript yellow 1  2
TypeScript cyan   7  3
Rust orange      18  5
Go green         10  7
```

---

# Business

## Cycle

```dgmo
cycle Continuous Delivery Loop

circle-nodes

Plan | color: blue
  Capture user stories and acceptance criteria
  - Triage backlog
  - Estimate effort
  -Sprint ready-> | color: blue, width: 5

Build | color: green
  Implement feature with tests and code review
  - Pair on tricky modules
  - Open pull request
  -PR merged-> | color: green, width: 5

Test | color: orange
  Run unit, integration, and end-to-end suites
  - Smoke test in staging
  - Verify performance budgets
  -All green-> | color: orange, width: 5

Deploy | color: purple
  Ship to production via automated pipeline
  - Canary 10% of traffic
  - Promote to 100%
  -Live-> | color: purple, width: 5

Monitor | color: red
  Watch metrics, logs, and user feedback
  - Alert on SLO regressions
  - Capture telemetry for next planning round
  -Insights-> | color: red, width: 5
```

---

## Funnel

```dgmo
funnel Sales Pipeline Conversion
solid-fill

Website Visitors      12000
Product Page Views     5400
Free Trial Signups     2100
Onboarding Complete     890
Paid Conversion         340
```

---

## Journey Map

```dgmo
journey-map New Customer Onboarding

persona Alex | color: blue
  Mid-market product manager evaluating analytics tools
  Needs to convince three internal stakeholders before purchase

tag Stage as s
  Discovery blue
  Trial green
  Activation orange
  Expansion purple

[Discovery]
  Search for solutions | 3, s: Discovery
    thought: There must be something better than spreadsheets
    description: Lands on the marketing site via Google
  Compare three vendors | 2 Cautious, s: Discovery
    pain: Pricing pages are hard to compare apples-to-apples
    opportunity: A side-by-side comparison page would help

[Trial]
  Sign up for free trial | 4 Hopeful, s: Trial
    description: Account created in under 30 seconds
  Complete first integration | 2 Frustrated, s: Trial
    pain: Auth setup took longer than expected
    thought: Hope this is worth the effort
  Build first dashboard | 5 Excited, s: Trial
    description: First chart renders, the wow moment
    opportunity: Surface example dashboards earlier

[Activation]
  Invite teammates | 4, s: Activation
    description: Three colleagues join the workspace
  Schedule weekly review | 5 Confident, s: Activation
    thought: This is becoming part of how we work
  Hit feature ceiling on free plan | 2 Pressured, s: Activation
    pain: Cannot export beyond 100 rows
    opportunity: Show upgrade value contextually

[Expansion]
  Convert to paid plan | 4, s: Expansion
    description: Picks team plan after stakeholder approval
  Roll out to second department | 5 Triumphant, s: Expansion
    description: Marketing team adopts the same workspace
```

---

## Org Chart

```dgmo
org Engineering Department
solid-fill

tag Role as r
  VP red
  Director orange
  Manager yellow
  Lead green
  IC blue

VP Engineering | r: VP
  Director of Platform | r: Director
    Infrastructure Lead | r: Lead
      Backend Engineer | r: IC
      Backend Engineer | r: IC
      SRE | r: IC
    Data Lead | r: Lead
      Data Engineer | r: IC
      Analytics Engineer | r: IC
  Director of Product Eng | r: Director
    Web Manager | r: Manager
      Frontend Engineer | r: IC
      Frontend Engineer | r: IC
      Designer | r: IC
    Mobile Manager | r: Manager
      iOS Engineer | r: IC
      Android Engineer | r: IC
  QA Manager | r: Manager
    QA Engineer | r: IC
    QA Engineer | r: IC
```

---

## Pyramid

```dgmo
pyramid Maslow's Hierarchy of Needs
solid-fill

Self-Actualization | color: purple
  Personal growth, creativity, fulfillment of potential

Esteem | color: blue
  Confidence, achievement, respect from others

Belonging | color: green
  Friendship, family, intimacy, sense of connection

Safety | color: yellow
  Security of body, employment, health, property

Physiological | color: red
  Food, water, warmth, rest, shelter
```

---

## Quadrant

```dgmo
quadrant Feature Prioritization Matrix
x-label Low Effort, High Effort
y-label Low Impact, High Impact

top-left Quick Wins green
top-right Major Projects blue
bottom-left Fill-ins gray
bottom-right Avoid red

Dark Mode blue        0.25  0.85
API v2 red             0.8   0.9
Fix Typos                0.1   0.15
SSO Integration          0.75  0.7
Export CSV               0.3   0.6
Mobile App               0.9   0.95
Inline Help Tooltips     0.2   0.7
Refactor Auth Module     0.85  0.4
```

---

## Ring

```dgmo
ring Product Manager's Sphere of Influence
solid-fill

Direct Team | color: red
  Engineers, designers, QA — daily
  collaboration on the roadmap.

Cross-Functional Partners | color: orange
  Sales, marketing, support — quarterly
  planning and feature requests.

Executive Stakeholders | color: yellow
  CEO, CTO, VP Sales — strategic
  alignment and budget approval.

External Customers | color: green
  Users, beta testers, advisory board —
  feedback shapes priorities.

Industry & Competitors | color: blue
  Market trends, competitive moves —
  context but not directly controllable.
```

---

## Sankey

```dgmo
sankey Website Traffic Flow

Organic Search green
  Landing Page 450
Paid Ads orange
  Landing Page 280
Social Media blue
  Landing Page 180

Landing Page
  Sign Up 340
  Browse Products 520
  Bounce 260 red

Sign Up
  Free Trial 240
  Paid Plan 100

Browse Products
  Add to Cart 310
  Exit 210 red

Add to Cart
  Purchase green 220
  Abandon 90 red
```

---

## Tech Radar

```dgmo
tech-radar Frontend Tech Stack — Q1 2026

rings
  Adopt
  Trial
  Assess
  Hold

Frameworks | quadrant: top-right
  React | ring: Adopt, trend: stable
    Default for all new web surfaces. Strong ecosystem and team familiarity.
  Astro | ring: Adopt, trend: up
    Standard for marketing and content-heavy pages. Ships almost zero JS.
  SolidJS | ring: Trial, trend: new
    Promising performance characteristics. Two pilot projects underway.
  Vue | ring: Hold, trend: down
    Legacy admin app only. New work goes to React.

Build & Tooling | quadrant: top-left
  Vite | ring: Adopt, trend: stable
    Fast HMR, good TypeScript story.
  Bun | ring: Trial, trend: up
    Faster install + test runner. Caveats with some native modules.
  Webpack | ring: Hold, trend: down
    Migrating remaining bundles to Vite by Q3.

State & Data | quadrant: bottom-left
  Zustand | ring: Adopt, trend: stable
    Lightweight, no provider boilerplate.
  TanStack Query | ring: Adopt, trend: stable
    Standard for server state and caching.
  Redux Toolkit | ring: Hold, trend: down
    Existing apps only. Don't introduce in new code.

Styling | quadrant: bottom-right
  Tailwind CSS | ring: Adopt, trend: stable
    Standard utility framework across all surfaces.
  CSS Modules | ring: Trial, trend: stable
    For complex component-scoped styles where Tailwind feels heavy.
  styled-components | ring: Hold, trend: down
    Runtime cost is no longer worth it. Migrate to Tailwind or CSS Modules.
```

---

## Venn

```dgmo
venn Full-Stack Developer Skills

Frontend blue
Backend green
DevOps orange

Frontend + Backend Web Apps
Backend + DevOps Infrastructure
Frontend + DevOps CI/CD
Frontend + Backend + DevOps Unicorns
```

---

## Word Cloud

```dgmo
wordcloud Tech Conference Topics

Kubernetes 95
Machine Learning 88
Microservices 72
DevOps 68
Serverless 55
GraphQL 48
TypeScript 82
Rust 62
WebAssembly 45
Edge Computing 38
Observability 52
Platform Engineering 60
AI Agents 90
LLM 85
Vector Databases 50
RAG 65
```

---

# Project

## DACI

```dgmo
raci Architecture Decisions
variant-daci
roles
  CTO
  TechLead
  Engineer
  Security

[Database Choices]
  Pick primary database
    TechLead: D
    CTO: A
    Engineer: C
    Security: C
  Schema migration strategy
    TechLead: D A
    Engineer: C
  Backup and DR plan
    TechLead: D
    CTO: A
    Security: C

[Auth & Identity]
  Choose SSO provider
    Security: D
    CTO: A
    TechLead: C
  Session token storage
    Security: D A
    Engineer: I
  MFA rollout plan
    Security: D
    CTO: A
    Engineer: C
```

---

## Gantt

```dgmo
gantt Product Launch Plan
start 2026-01-15
dependencies

tag Team as t
  Engineering blue
  Design purple
  QA orange

parallel
  [Backend] | t: Engineering
    30bd Database Layer | 80%
    10bd? Auth Module | 100%
    parallel
      5bd Load Testing | t: QA
      5bd Security Audit | t: QA

  [Frontend] | t: Design
    15bd Component Library
    10bd API Integration | t: Engineering
    5bd Polish | 30%

[Integration] | t: QA
  10bd E2E Testing
  0d Release Candidate
```

---

## Kanban

```dgmo
kanban Sprint 7
solid-fill

tag Priority
  Low green
  Medium yellow
  High orange
  Urgent red

tag Owner as o
  Alex blue
  Jordan purple
  Sam teal

[To Do] red
  Recruit two senior engineers | priority: High, o: Alex
  Draft Q2 release plan | priority: Urgent, o: Alex
  Update onboarding docs | priority: Low, o: Sam

[In Progress] orange | wip: 3
  Define API contracts | priority: High, o: Jordan
  Refactor auth module | priority: Urgent, o: Jordan
  Build settings UI | priority: Medium, o: Sam

[Review] blue
  Mobile push notifications | priority: High, o: Alex
  Analytics dashboard | priority: Medium, o: Sam

[Done] green
  Deploy staging environment | priority: High, o: Jordan
  Fix login regression | priority: Low, o: Sam
```

---

## PERT

```dgmo
pert Product Launch Critical Path
time-unit w
default-confidence medium

kickoff 0
  -> requirements

[Requirements & Design]
  requirements 1 2 3
    -> tech spec
    -> wireframes
  tech spec 2 3 5
    -> api design
  wireframes 1 2 3
    -> ui prototype

api design 1 2 3
  -> backend build
ui prototype 1 2 3
  -> frontend build

[Build]
  backend build 3 5 8
    -> integration
  frontend build 3 5 7
    -> integration

integration 1 2 4
  -> qa
  -> docs

qa 1 2 3
  -> launch
docs 1 2 3
  -> launch

launch 0
```

---

## RACI

```dgmo
raci Q3 Product Launch
roles
  PM    | color: blue
  Eng   | color: green
  UX    | color: purple
  Mkt   | color: orange
  Sales | color: red

[Discovery]
  Define the problem
    PM: A R
    UX: C
    Eng: I
  Customer interviews
    PM: A
    UX: R
    Mkt: C

[Build]
  Spec the API
    PM: C
    Eng: A R
  Ship the prototype
    Eng: A R
    UX: C
    PM: I
  Design system updates
    UX: A R
    Eng: C

[Launch]
  Pricing and positioning
    PM: C
    Mkt: A R
    Sales: C
  Sales enablement
    Mkt: C
    Sales: A R
    Eng: I
  Public launch
    PM: C
    Mkt: A R
    Sales: C
```

---

## RASCI

```dgmo
rasci Sprint Planning
roles
  PM
  TechLead
  Engineer
  QA
  Designer

[Refinement]
  Triage backlog
    PM: A R
    TechLead: C
    Engineer: S
  Estimate stories
    TechLead: A R
    Engineer: R
    PM: C

[Sprint Execution]
  Implement feature
    Engineer: A R
    TechLead: S
    QA: I
  Design review
    Designer: A R
    Engineer: C
    PM: I
  Run test suite
    QA: A R
    Engineer: S
```

---

## Timeline

```dgmo
timeline Product Roadmap 2026

tag Team as t
  Engineering blue
  Design purple
  QA orange

era 2026-01 -> 2026-06 Phase 1: Foundation
era 2026-07 -> 2026-12 Phase 2: Growth teal

marker 2026-03 Beta Launch red
marker 2026-09 GA Release green

Core API Development start: 2026-01, end: 2026-03, t: Engineering
Auth and Permissions start: 2026-02, end: 2026-05, t: Engineering
Real-time Features start: 2026-04, end: 2026-07, t: Engineering
Performance Optimization start: 2026-08, end: 2026-11, t: Engineering
Design System v1 start: 2026-01, end: 2026-02, t: Design
User Research start: 2026-03, end: 2026-05, t: Design
Design System v2 start: 2026-06, end: 2026-08, t: Design
Test Automation Suite start: 2026-04, end: 2026-06, t: QA
Launch QA Hardening start: 2026-09, end: 2026-12, t: QA
```

---

# Software

## Boxes and Lines

```dgmo
boxes-and-lines System Architecture

tag Status as s
  Operational green
  Degraded orange
  Down red
  Planned blue default

active-tag Status

MobileApp | s: Operational
  -> APIGateway

WebApp | s: Operational
  -> APIGateway

APIGateway | s: Operational
  -> [Services]
  -> AuthVendor

[Services]
  UserService | s: Operational
    -> Database
  OrderService | s: Degraded
    -> Database
    -> PaymentVendor
  Database | s: Operational

PaymentVendor | s: Operational
AuthVendor | s: Operational

AnalyticsPipeline | s: Planned
  -> Database
```

---

## C4 Architecture

```dgmo
c4 Internet Banking System
solid-fill

tag Scope as sc
  Internal blue
  External gray

Customer is a person | description: A retail customer of the bank, sc: External

Banking is a system | description: Core internet banking application, sc: Internal
  -Uses-> Customer

  containers
    WebApp is a container | description: Single-page application, tech: React
    API is a container | description: Backend API serving the SPA, tech: Node.js
    DB is a container is a database | description: Customer accounts and transactions, tech: PostgreSQL

Email is a system | description: External transactional email service, sc: External
  ~Sends notifications via~> Banking

deployment
  CustomerDevice
    container WebApp
  CloudInfra
    container API
    container DB
```

---

## Class Diagram

```dgmo
class Shape Hierarchy

interface Drawable
  + draw(): void
  + getBounds(): Rect

abstract Shape implements Drawable
  # x: number
  # y: number
  + getPosition(): Point
  + translate(dx: number, dy: number): void

Circle extends Shape
  - radius: number
  + area(): number

Rectangle extends Shape
  - width: number
  - height: number
  + area(): number

Triangle extends Shape
  - base: number
  - height: number
  + area(): number

enum ShapeKind
  Circle
  Rectangle
  Triangle

Shape
  -> ShapeKind has kind
```

---

## Entity-Relationship

```dgmo
er Online Store

users
  id int pk
  email varchar unique
  name varchar
  created_at timestamp
  1-places-* orders

orders
  id int pk
  user_id int fk
  status varchar
  total decimal
  created_at timestamp
  1-contains-* order_items
  ?-ships_to-1 addresses

order_items
  id int pk
  order_id int fk
  product_id int fk
  quantity int
  price_at_purchase decimal

products
  id int pk
  name varchar
  description text nullable
  price decimal
  stock int
  1-listed_in-* order_items

addresses
  id int pk
  user_id int fk
  line1 varchar
  city varchar
  postal_code varchar
  country varchar
```

---

## Flowchart

```dgmo
flowchart Login Flow
solid-fill

(Open App) -> [Cached Session?]
[Cached Session?] -- yes --> [Validate Token]
[Cached Session?] -- no --> /Show Login/

[Validate Token] -- valid --> ((Home Screen)) green
[Validate Token] -- expired --> /Show Login/

/Show Login/ -> [[Submit Credentials]]
[[Submit Credentials]] -- ok --> ((Home Screen))
[[Submit Credentials]] -- 401 --> /Show Error/ red
/Show Error/ -> /Show Login/
```

---

## Infrastructure

```dgmo
infra Production Traffic Flow

tag Team as t
  Platform blue
  Backend teal
  Data purple

Edge
  rps 10000
  -> CloudFront

CloudFront | t: Platform
  cache-hit 80%
  -> ALB

ALB | t: Platform
  -/api-> APIServer | split: 70%
  -/static-> StaticServer | split: 30%

APIServer | t: Backend
  instances 4
  max-rps 500
  latency-ms 45
  -> PostgresDB
  ~events~> EventBus

PostgresDB | t: Data
  latency-ms 8

EventBus | t: Backend
  buffer 1000
  -> AnalyticsWorker

AnalyticsWorker | t: Data
  instances 2
  max-rps 100

StaticServer | t: Platform
  latency-ms 5
```

---

## Mindmap

```dgmo
mindmap API Design Considerations

Versioning
  URL Path | description: /v1/users, /v2/users
  Header | description: Accept: application/vnd.api+json;v=2
  Sunset Policy | description: Announce deprecation 6 months ahead
Authentication
  OAuth 2.0
    Authorization Code Flow | description: Web apps with backend
    Client Credentials | description: Server-to-server
  API Keys | description: Simple but harder to rotate
Errors
  Status Codes | description: Use the right 4xx vs 5xx
  Problem Details | description: RFC 7807 — type, title, detail, instance
  Idempotency | description: Safe to retry on network failures
Pagination
  Cursor-based | description: Stable across writes
  Offset-based | description: Simpler but breaks under inserts
Performance
  Caching
    ETags | description: Conditional GETs
    Cache-Control | description: max-age, stale-while-revalidate
  Compression | description: gzip and brotli on responses
  Rate Limiting | description: Per-key with retry-after header
```

---

## Sequence

```dgmo
sequence Checkout Flow

active-tag Team

tag Team as t
  Web blue
  Backend green
  Vendor orange

User is an actor
App | t: Web
[Backend] | t: Backend
  API
  Orders
  Inventory
  DB
Stripe | t: Vendor

User -click checkout-> App
App -POST /orders-> API
note
  - validate cart
  - check session
API -createOrder-> Orders
Orders -reserveStock-> Inventory

if stock available
  Inventory -OK-> Orders
  Orders -POST /charge-> Stripe
  Stripe -charge_id-> Orders
  Orders -writeOrder-> DB
  DB -order_id-> Orders
  Orders -201 Created-> API
  API -receipt-> App
  App -Show receipt-> User
else
  Inventory -out of stock-> Orders
  Orders -409 Conflict-> API
  API -error-> App
  App -Sorry, sold out-> User

== Notify ==

Orders ~order.placed~> DB
Orders ~analytics~> API
```

---

## Sitemap

```dgmo
sitemap SaaS Application

tag Access
  Public green
  Authenticated blue
  Admin red

tag Page
  Marketing purple
  Form orange
  Content cyan

Home | Access: Public, Page: Marketing
  -pricing-> Pricing
  -signup-> Signup
  -login-> Login

Pricing | Access: Public, Page: Marketing
Signup | Access: Public, Page: Form
  -created-> Dashboard
Login | Access: Public, Page: Form
  -ok-> Dashboard

[App]
  Dashboard | Access: Authenticated, Page: Content
    -open-> Project
  Project | Access: Authenticated, Page: Content
    -edit-> Settings
  Settings | Access: Authenticated, Page: Form

[Admin]
  Users | Access: Admin, Page: Content
  Billing | Access: Admin, Page: Content
  AuditLog | Access: Admin, Page: Content
```

---

## State Machine

```dgmo
state Order Lifecycle
solid-fill

[*] -> Pending

Pending
  -submit-> Validating

Validating
  -approved-> Processing
  -rejected-> Cancelled

[Fulfillment]
  Processing
    -pack-> Shipping
    -out of stock-> Cancelled

  Shipping
    -delivered-> Delivered
    -lost-> Refunded

[Resolution]
  Delivered
    -return request-> Returning

  Returning
    -received-> Refunded

Cancelled -> [*]
Refunded -> [*]
Delivered -> [*]
```

---

## Wireframe

```dgmo
wireframe Settings Screen

[Header]
  Workspace Settings
  nav
    General | active
    Members
    Billing
    Integrations

[Main]
  # General

  Workspace Name [Acme Corp]
  Workspace URL [acme.example.com] | readonly

  {Free | Team | Enterprise}

  <x> Allow guest access
  < > Require two-factor auth
  <x> Show getting-started checklist

  (*) Light theme
  ( ) Dark theme
  ( ) Match system

  (Save Changes)
  (Cancel) | ghost

  ---

  Need help configuring? (Open Docs) | ghost
```
